import {aws_ec2 as ec2, aws_memorydb as memdb, Stack, StackProps,} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {SubnetType} from "aws-cdk-lib/aws-ec2";

interface MemoryDBProps {
    nodeType: string | ec2.InstanceType;
    vpc: ec2.Vpc;
    subnets: ec2.ISubnet[],
    securityGroups: ec2.ISecurityGroup[],
}

class MemoryDB extends Construct {
    constructor(scope: Construct, id: string, props: MemoryDBProps) {
        super(scope, id);

        if (props.subnets.length <2)
            throw new Error('need at least 2 subnets')

        const subnetGroup = new memdb.CfnSubnetGroup(this, 'mint', {
            subnetGroupName: `${id}-subnet`,
            subnetIds: props.subnets.map(net => net.subnetId),
        });

        const cluster = new memdb.CfnCluster(this, 'mintdb', {
            aclName: 'open-access',
            clusterName: `${scope}-cluster`,
            nodeType: props.nodeType.toString(),
            autoMinorVersionUpgrade: true,
            engineVersion: '6.2',
            subnetGroupName: subnetGroup.subnetGroupName,
            securityGroupIds: props.securityGroups.map(sg => sg.securityGroupId),
        });
        cluster.addDependsOn(subnetGroup);
    }
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

        const sg = new ec2.SecurityGroup(this, 'sg', {
            vpc,
            allowAllOutbound: true,
        });
        sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22))

        const node = new ec2.Instance(this, 'node-1', {
            vpc,
            machineImage: ec2.MachineImage.genericLinux({
                    'eu-west-1': 'ami-05443c15b2ac1c1d6'
                }
            ),
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
            keyName: 'mint',
            vpcSubnets: {subnetType: ec2.SubnetType.PUBLIC},
            securityGroup: sg,
        });

        const sgRedis = new ec2.SecurityGroup(this, 'sgRedis', {vpc, allowAllOutbound: false});
        sgRedis.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(6379));

        const db = new MemoryDB(this, 'mintdb', {
            nodeType: 'db.t4g.small',
            vpc,
            subnets: vpc.isolatedSubnets,
            securityGroups: [sgRedis],
        });


    }
}
