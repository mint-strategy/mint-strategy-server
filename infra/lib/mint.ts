import {
    aws_ec2 as ec2, 
    aws_route53 as dns, 
    aws_rds as rds,
    aws_ecr as ecr,
    aws_iam as iam,
    Stack, StackProps, CfnOutput
} from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import {Asset} from 'aws-cdk-lib/aws-s3-assets';
import {Construct} from 'constructs';
import * as path from "path";

const images = {
    bullsEye: {
        x86: {
            'eu-west-1': 'ami-05443c15b2ac1c1d6'
        },
        arm64: {
            'eu-west-1': 'ami-0353cb95279bf4f20',
        }
    },
}

export class MintStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const vpc = new ec2.Vpc(this, 'mint', {
            maxAzs: 2,
            natGateways: 0,
            subnetConfiguration: [
                {
                    subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
                    name: 'isolated'
                },
                {
                    subnetType: ec2.SubnetType.PUBLIC,
                    name: 'public',
                },
            ],
        });

        const sgSsh = new ec2.SecurityGroup(this, 'sg', {
            vpc,
            allowAllOutbound: true,
        });
        sgSsh.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22));

        const fileAsset = new Asset(this, 'nodeSetupScript', {
            path: path.join(__dirname, '../assets/setup-node.sh')
        });

        const userData = ec2.UserData.forLinux();
        userData.addS3DownloadCommand({
            bucket: fileAsset.bucket,
            bucketKey: fileAsset.s3ObjectKey,
            localFile: '/opt/setup-node.sh'
        })
        userData.addExecuteFileCommand({filePath: '/opt/setup-node.sh'})

        const node = new ec2.Instance(this, 'node-1', {
                vpc,
                machineImage: ec2.MachineImage.genericLinux(images.bullsEye.arm64),
                instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MEDIUM),
                keyName: 'mint',
                vpcSubnets: {subnetType: ec2.SubnetType.PUBLIC},
                securityGroup: sgSsh,
                detailedMonitoring: true,
                blockDevices: [
                    {
                        deviceName: '/dev/xvda',
                        volume: {
                            ebsDevice: {
                                volumeSize: 50,
                                volumeType: ec2.EbsDeviceVolumeType.GP3,
                            }
                        }
                    }
                ],
                userData: userData,
                userDataCausesReplacement: true,
            }
        );

        const sgHttp = new ec2.SecurityGroup(this, 'sgHttp', {
            vpc,
            allowAllOutbound: false,
        });
        sgHttp.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));
        sgHttp.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443));
        sgHttp.addIngressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(80));
        sgHttp.addIngressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(443));
        node.addSecurityGroup(sgHttp);

        const sgK8s = new ec2.SecurityGroup(this, 'sgK8s', {
            vpc,
        });
        sgHttp.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(6443));
        sgHttp.addIngressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(6443));
        node.addSecurityGroup(sgK8s);

        const zone = dns.HostedZone.fromLookup(this, 'oekloZone', {domainName: 'oeklo.at'});

        fileAsset.grantRead(node);

        new dns.ARecord(this, 'mintARecord', {
            recordName: 'mint.dev.oeklo.at',
            target: {values: [node.instancePublicIp]},
            zone,
            ttl: cdk.Duration.minutes(1),
        });

        const sgPg = new ec2.SecurityGroup(this, 'sgPg', {vpc});
        sgPg.addIngressRule(ec2.Peer.ipv4(vpc.vpcCidrBlock), ec2.Port.tcp(5432));

        const db = new rds.DatabaseInstance(this, 'db1', {
            vpc,
            engine: rds.DatabaseInstanceEngine.postgres({version: rds.PostgresEngineVersion.VER_14}),
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MEDIUM),
            vpcSubnets: {subnetType: ec2.SubnetType.PRIVATE_ISOLATED},
            credentials: rds.Credentials.fromUsername('mint'),
            enablePerformanceInsights: true,
            securityGroups: [sgPg],
        });
        new cdk.CfnOutput(this, 'dbUrl', {value: db.instanceEndpoint.hostname});
        new cdk.CfnOutput(this, 'dbSecret', {value: db.secret!.secretName});


        const repo = new ecr.Repository(this, 'dockerRepo', {
            lifecycleRules: [{maxImageCount: 3}],
            repositoryName: 'mint',
        });
        repo.grant(iam.User.fromUserName(this, 'rafal', 'rafal'),
            'ecr:*'
        );
        const repoGrantForNode1 = repo.grant(node,
            // "ecr:GetAuthorizationToken",
            "ecr:BatchCheckLayerAvailability",
            "ecr:GetDownloadUrlForLayer",
            "ecr:GetRepositoryPolicy",
            'ecr:DescribeRepositories',
            'ecr:ListImages',
            'ecr:BatchGetImage',
        );
        
        new CfnOutput(this, 'repoAddr', {value: repo.repositoryUri});
    };
}
