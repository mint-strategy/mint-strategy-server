import {Construct} from "constructs";
import {aws_iam as iam, aws_s3 as s3, CfnOutput, RemovalPolicy} from "aws-cdk-lib";

export class Prefect extends Construct {
    constructor(scope: Construct, id: string) {
        super(scope, id);

        const prefectUser = new iam.User(this, 'prefect', {path: '/service/',});
        const prefectKey = new iam.AccessKey(this, 'prefectAccessKey', {
            user: prefectUser,
        });
        new CfnOutput(this, 'prefectKeyId', {value: prefectKey.accessKeyId});
        new CfnOutput(this, 'prefectKeySecret', {value: prefectKey.secretAccessKey.toString()});

        const prefectBucket = new s3.Bucket(this, 'prefect-storage', {
            accessControl: s3.BucketAccessControl.PRIVATE,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: RemovalPolicy.DESTROY,
        });
        prefectBucket.grantReadWrite(prefectUser);
        new CfnOutput(this, 'prefectBucketName', {value: prefectBucket.bucketName});
    }
}
