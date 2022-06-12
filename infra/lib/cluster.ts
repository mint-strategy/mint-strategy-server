import {Construct} from "constructs";
import * as xb from "@aws-quickstart/eks-blueprints";
import {ClusterAddOn} from "@aws-quickstart/eks-blueprints";
import {aws_ec2 as ec2, aws_iam as iam, StackProps, Tags} from "aws-cdk-lib";
import {AwsLoadBalancerControllerAddOn} from "@aws-quickstart/eks-blueprints/dist/addons/aws-loadbalancer-controller";

export interface EksClusterProps extends StackProps {
    vpc: ec2.IVpc;
}

const rafalArn = 'arn:aws:iam::432025153586:user/rafal';

class MasterAccountAddOn implements ClusterAddOn {
    deploy(clusterInfo: xb.ClusterInfo): Promise<Construct> | void {
        const user = iam.User.fromUserArn(clusterInfo.cluster.stack, 'rafal', rafalArn);
        clusterInfo.cluster.awsAuth.addUserMapping(user, {groups: ['system:masters']})
    }
}

class ALBControllerTagsAddOn implements ClusterAddOn {
    deploy(clusterInfo: xb.ClusterInfo): Promise<Construct> | void {
        const vpc = clusterInfo.getResource(xb.GlobalResources.Vpc) as ec2.IVpc;
        vpc.isolatedSubnets.forEach(subnet => Tags.of(subnet).add("kubernetes.io/role/internal-elb", '1'));
        vpc.privateSubnets.forEach(subnet => Tags.of(subnet).add("kubernetes.io/role/internal-elb", '1'));
        vpc.publicSubnets.forEach(subnet => Tags.of(subnet).add("kubernetes.io/role/elb", '1'));
    }
}

export class EksCluster {
    build(scope: Construct, id: string, props: EksClusterProps) {
        const platformTeam = new xb.PlatformTeam({
            name: 'platformTeam',
            users: [
                new iam.ArnPrincipal(rafalArn),
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
                new xb.SecretsStoreAddOn,
                new AwsLoadBalancerControllerAddOn,
                new ALBControllerTagsAddOn,
                new MasterAccountAddOn,
            )
            .teams(platformTeam)
            .build(scope, id);
    }
}
