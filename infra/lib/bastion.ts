import {Construct} from "constructs";
import {aws_ec2 as ec2, CfnOutput} from "aws-cdk-lib";
import {images} from "./ami";

interface BastionProps {
    vpc: ec2.IVpc;
}

export class Bastion extends Construct {
    constructor(scope: Construct, id: string, props: BastionProps) {
        super(scope, id);

        const vpc = props.vpc;

        const sgSsh = new ec2.SecurityGroup(this, 'sg', {
            vpc,
            allowAllOutbound: true,
        });
        sgSsh.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22));

        const bastion = new ec2.Instance(this, 'bastion', {
            vpc,
            vpcSubnets: {subnetType: ec2.SubnetType.PUBLIC},
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
            machineImage: ec2.MachineImage.genericLinux(images.bullsEye.arm64),
            keyName: 'mint',
            securityGroup: sgSsh,
            detailedMonitoring: true,
            blockDevices: [
                {
                    deviceName: '/dev/xvda',
                    volume: {
                        ebsDevice: {
                            volumeSize: 8,
                            volumeType: ec2.EbsDeviceVolumeType.GP3,
                        }
                    }
                }
            ],
        });
        new CfnOutput(this, 'bastionPublicUrl', {value: bastion.instancePublicDnsName});
    }
}
