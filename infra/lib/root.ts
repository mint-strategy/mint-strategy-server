import {Construct} from "constructs";
import {aws_ec2 as ec2, Stack, StackProps} from "aws-cdk-lib";
import {Postgres} from "./postgres";
import {Bastion} from "./bastion";
import {Prefect} from "./prefect";

export default class RootStack extends Stack {
    vpc: ec2.IVpc;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const vpc = new ec2.Vpc(this, id + '-vpc', {
            maxAzs: 2,
            natGateways: 2,
            subnetConfiguration: [
                {
                    subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
                    name: 'isolated'
                },
                {
                    subnetType: ec2.SubnetType.PUBLIC,
                    name: 'public',
                },
                {
                    subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
                    name: 'private',
                },
            ],
        });
        this.vpc = vpc;

        new Postgres(this, 'pgsql', {vpc});
        new Bastion(this,'bastion',{vpc});
        new Prefect(this, 'prefect');
    }
}
