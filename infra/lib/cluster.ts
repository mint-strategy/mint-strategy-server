import {Construct} from "constructs";
import * as xb from "@aws-quickstart/eks-blueprints";
import {aws_ec2 as ec2, aws_iam as iam, StackProps} from "aws-cdk-lib";

export interface EksClusterProps extends StackProps {
    vpc: ec2.IVpc;
}

export class EksCluster {
    build(scope: Construct, id: string, props: EksClusterProps) {
        const stackID = `${id}-blueprint`

        const platformTeam = new xb.PlatformTeam({
            name: 'platformTeam',
            users: [
                new iam.ArnPrincipal('arn:aws:iam::432025153586:user/rafal'),
            ]
        });

        xb.EksBlueprint.builder()
            .resourceProvider(xb.GlobalResources.Vpc, new xb.DirectVpcProvider(props.vpc))
            .account(props.env!.account)
            .region(props.env!.region)
            .addOns(
                new xb.MetricsServerAddOn,
                new xb.ContainerInsightsAddOn,
                new xb.ClusterAutoScalerAddOn,
                new xb.SecretsStoreAddOn
            )
            .teams(platformTeam)
            .build(scope, stackID);
    }
}