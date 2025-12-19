import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export interface SecureVpcProps {
  maxAzs?: number;
  natGateways?: number;
}

export class SecureVpc extends ec2.Vpc {
  constructor(scope: Construct, id: string, props: SecureVpcProps = {}) {
    super(scope, id, {
      maxAzs: props.maxAzs || 2,
      natGateways: props.natGateways || 1,
      subnetConfiguration: [
        {
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: "Private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });
  }
}
