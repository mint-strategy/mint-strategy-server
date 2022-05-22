#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {EksCluster} from "../lib/cluster";
import RootStack from "../lib/root";

const app = new cdk.App();
const props = {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'eu-west-1',
    },
    tags: {
        'Project': 'raphael',
    },
};
const root = new RootStack(app, 'root', props);
new EksCluster().build(app, 'cluster', {...props, vpc: root.vpc});
