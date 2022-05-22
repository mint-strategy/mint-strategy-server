#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {MintStack} from "../lib/mint";

const app = new cdk.App();
new MintStack(app, 'mint', {
    env: {account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-west-1'},
    tags: {
        'Project': 'mint',
    }
});
