import {Construct} from "constructs";
import {aws_ec2 as ec2, aws_rds as rds, CfnOutput} from "aws-cdk-lib";

interface PostgresProps {
    vpc: ec2.IVpc,
}

export class Postgres extends Construct {
    constructor(scope: Construct, id: string, props: PostgresProps) {
        super(scope, id);

        const vpc = props.vpc;

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
        new CfnOutput(this, 'dbUrl', {value: db.instanceEndpoint.hostname});
        new CfnOutput(this, 'dbSecret', {value: db.secret!.secretName});
    }
}