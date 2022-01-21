import { Vpc, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import {
    Cluster,
    FargateService,
    FargateTaskDefinition,
    PropagatedTagSource,
} from 'aws-cdk-lib/aws-ecs';
import {
    DnsRecordType,
    PrivateDnsNamespace,
} from 'aws-cdk-lib/aws-servicediscovery';
import { Construct } from 'constructs';

export interface ServiceProps {
    definition: FargateTaskDefinition;
    name?: string;
    endpoint?: string;
}

export class Service extends Construct {
    constructor(scope: Construct, id: string, props: ServiceProps) {
        super(scope, id);

        const vpc = Vpc.fromLookup(this, 'VPC', {
            vpcName: this.node.tryGetContext('vpc'),
        });

        const cluster = Cluster.fromClusterAttributes(this, 'Cluster', {
            clusterName: this.node.tryGetContext('cluster'),
            vpc,
            securityGroups: [
                // SecurityGroup.fromSecurityGroupId(
                //     this,
                //     'SecurityGroup',
                //     'sg-04fb73800092ea7a8'
                // ),
            ],
        });

        const name =
            props.endpoint ||
            props.name ||
            props.definition.family ||
            this.node.tryGetContext('service');

        const dnsNamespace = new PrivateDnsNamespace(this, 'DnsNamespace', {
            vpc,
            name,
            description: `Private DnsNamespace for ${name}`,
        });

        // const serviceSecGrp = new SecurityGroup(
        //     this,
        //     `${serviceName}ServiceSecurityGroup`,
        //     {
        //         allowAllOutbound: true,
        //         securityGroupName: `${serviceName}ServiceSecurityGroup`,
        //         vpc: vpc,
        //     }
        // );

        // serviceSecGrp.connections.allowFromAnyIpv4(Port.tcp(80));

        new FargateService(this, `Service`, {
            cluster: cluster,
            taskDefinition: props.definition,
            assignPublicIp: true,
            desiredCount: 1,
            serviceName: name,
            propagateTags: PropagatedTagSource.SERVICE,
            enableECSManagedTags: true,
            cloudMapOptions: {
                name,
                cloudMapNamespace: dnsNamespace,
                dnsRecordType: DnsRecordType.A,
            },
        });
    }
}
