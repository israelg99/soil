import * as policy from 'cdk-iam-floyd';

export function Parameter(param: string): policy.PolicyStatement {
    return new policy.Ssm()
        .onParameter(`${param}*`)
        .toGetParameters()
        .toGetParametersByPath()
        .toDeleteParameters()
        .toDeleteParameter()
        .toPutParameter();
}

export interface RunTaskProps {
    definition?: string;
    cluster?: string;
    container?: string;
    revision?: string;
}
export function RunTask(props: RunTaskProps): policy.PolicyStatement {
    let p = new policy.Ecs().toCreateService().toStartTask().toRunTask();
    if (props.definition) {
        p = p.ifTaskDefinition(`${props.definition}`);
    }
    if (props.cluster) {
        p = p.onCluster(props.cluster);
    }
    if (props.container) {
        p = p.ifContainerName(`${props.container}`);
    }
    return p;
}
