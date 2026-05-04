#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { NewsRecommenderStack } from "../lib/news-recommender-stack";

const app = new cdk.App();

new NewsRecommenderStack(app, "NewsRecommenderStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "us-east-1"
  }
});
