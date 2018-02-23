import QcloudAPI from 'qcloudapi-sdk'

/**
 * Qcloud API Gateway API
 * 
 * @example
 * new QcloudAPIGateway({
 *   SecretId: 'xxx',
 *   SecretKey: 'xxx',
 *   Region: 'sh'
 * })
 *   .describeServicesStatus()
 *   .then(console.log)
 * 
 * { totalCount: 1, serviceStatusSet: [ { serviceId: 'service-0abc0def' ... } ] }
 */
export class QcloudAPIGateway {
    qcloudAPI: QcloudAPIClass

    constructor(
        options: Options = {
            SecretId: process.env.QCLOUD_SECRETID,
            SecretKey: process.env.QCLOUD_SECRETKEY,
        }
    ) {
        // TODO: Do we just ignore secret check?
        // if (!options.SecretId || !options.SecretKey) {
        //     console.warn('SecretId and SecretKey is required!')
        // }

        this.qcloudAPI = new QcloudAPI({
            SecretId: options.SecretId,
            SecretKey: options.SecretKey,
            serviceType: 'apigateway',
            Region: options.Region || 'gz',
        })
    }

    setRegion(region: Region) {
        this.qcloudAPI.defaults.Region = region
        return this
    }

    request(data, opts = {}, extra = {}): Promise<any> {
        return new Promise((resolve, reject) => {
            this.qcloudAPI.request(
                data,
                opts,
                (err, res) => {
                    if (err) {
                        reject(err)
                    } else if (res.code > 0) {
                        const error = new Error(res.message)
                        error.name = res.codeDesc
                        reject(error)
                    } else {
                        delete res.code
                        delete res.message
                        delete res.codeDesc
                        resolve(res)
                    }
                },
                extra
            )
        })
    }

    /**
     * List or search services
     * @desc limit range [0,100]
     * @desc searchId is serviceId starts with `service-`
     * @desc searchName is serviceName
     */
    describeServicesStatus(
        params?: Pager & { searchId?: string, searchName?: string }
    ): Promise<TotalCount & { serviceStatusSet: ServiceStatus[] }> {
        return this.request({
            Action: 'DescribeServicesStatus',
        })
    }

    describeService(
        params: Pick<Service, 'serviceId'>
    ): Promise<ServiceStatus> {
        return this.request(Object.assign({}, params, {
            Action: 'DescribeService',
        }))
    }

    createService(
        params: Partial<Pick<Service, 'protocol' | 'serviceName' | 'serviceDesc'>>
    ): Promise<Pick<Service, 'serviceId' | 'serviceName' | 'serviceDesc' | 'subDomain' | 'createdTime'>> {
        return this.request(Object.assign({}, params, {
            Action: 'CreateService',
        }))
            .then(res => res.data)
    }

    modifyService(
        params: Pick<Service, 'serviceId'> & Partial<Pick<Service, 'serviceName' | 'serviceDesc' | 'protocol'>>
    ): Promise<Pick<Service, 'serviceId' | 'serviceName' | 'serviceDesc' | 'protocol' | 'modifiedTime'>> {
        return this.request(Object.assign({}, params, {
            Action: 'ModifyService',
        }))
    }

    deleteService(
        params: Pick<Service, 'serviceId'>
    ): Promise<{ requestId: null }> {
        return this.request(Object.assign({}, params, {
            Action: 'DeleteService',
        }))
    }

    /**
     * List or search apis
     * @desc searchId starts with `service-`
     * @desc limit range [0,100]
     * @desc searchName is url path `/path`
     */
    describeApisStatus(
        params: Pick<Service, 'serviceId'> & Pager & { searchName?: string }
    ): Promise<TotalCount & { apiIdStatusSet: ApiStatus[] }> {
        return this.request(Object.assign({}, params, {
            Action: 'DescribeApisStatus',
        }))
    }

    describeApi(
        params: Pick<Api, 'apiId' | 'serviceId'>
    ): Promise<Api & Pick<Service, 'serviceName' | 'serviceDesc'>> {
        // console.warn('Official working in progress.')
        return this.request(Object.assign({}, params, {
            Action: 'DescribeApi',
        }))
    }

    createApi(
        params: Omit<Api, 'apiId'>
    ): Promise<Pick<Api, 'apiId' | keyof ApiRequestConfig | keyof Timestamps>> {
        return this.request(Object.assign({}, params, {
            Action: 'CreateApi',
        }))
    }

    modifyApi(
        params: Api
    ): Promise<{}> {
        return this.request(Object.assign({}, params, {
            Action: 'ModifyApi',
        }))
    }

    runApi(
        params: Pick<Api, 'serviceId' | 'apiId'> & {
            contentType: 'application/x-www-form-urlencoded' | 'application/json'
        }
    ): Promise<{
        returnCode: number
        returnHeader: string
        returnBody: string
        delay: number
    }> {
        return this.request(Object.assign({}, params, {
            Action: 'RunApi',
        }))
    }

    deleteApi(
        params: Pick<Api, 'apiId' | 'serviceId'>
    ): Promise<{}> {
        return this.request(Object.assign({}, params, {
            Action: 'DeleteApi',
        }))
    }

    releaseService(
        params: Omit<ServiceRelease, 'releaseTime'>
    ): Promise<Pick<ServiceRelease, 'releaseDesc' | 'releaseTime'>> {
        return this.request(Object.assign({}, params, {
            Action: 'ReleaseService',
        }))
    }

    describeServiceEnvironmentList(
        params: Pick<Service, 'serviceId'>
    ): Promise<TotalCount & { environmentList: ServiceEnvironment[] }> {
        return this.request(Object.assign({}, params, {
            Action: 'DescribeServiceEnvironmentList',
        }))
    }

    unReleaseService(
        params: Pick<ServiceRelease, 'serviceId' | 'environmentName'>
    ): Promise<{ unReleaseDesc: null }> {
        return this.request(Object.assign({}, params, {
            Action: 'UnReleaseService',
        }))
    }

    describeServiceReleaseVersion(
        params: Pick<ServiceRelease, 'serviceId'> & Pager
    ): Promise<TotalCount & { versionList: ServiceVersion[] }> {
        return this.request(Object.assign({}, params, {
            Action: 'DescribeServiceReleaseVersion',
        }))
    }

    describeUsagePlansStatus(
        params: Pager
    ): Promise<TotalCount & { usagePlanStatusSet: UsagePlanStatus[] }> {
        return this.request(Object.assign({}, params, {
            Action: 'DescribeUsagePlansStatus',
        }))
    }

    describeUsagePlan(
        params: Pick<UsagePlan, 'usagePlanId'>
    ): Promise<UsagePlanBind> {
        return this.request(Object.assign({}, params, {
            Action: 'DescribeUsagePlan',
        }))
    }

    createUsagePlan(
        params: Pick<UsagePlan, 'usagePlanName' | 'usagePlanDesc' | 'maxRequestNumPreSec' | 'requestControlUnit'>
    ): Promise<Pick<UsagePlan, 'usagePlanId' | 'usagePlanName' | 'usagePlanDesc' | 'createdTime'>> {
        return this.request(Object.assign({}, params, {
            Action: 'CreateUsagePlan',
        }))
    }
}

export type Diff<T extends string, U extends string> = ({[P in T]: P } & {[P in U]: never } & { [x: string]: never })[T]
export type Omit<U, K extends keyof U> = Pick<U, Diff<keyof U, K>>

export type Region = 'bj' | 'sh' | 'gz'

export interface Options {
    SecretId: string
    SecretKey: string
    Region?: Region
}

export interface QcloudAPIOptions extends Options {
    serviceType: string
}

export interface QcloudAPIResponse {
    code: number
    message: string
    codeDesc: string
    data?: any
    [key: string]: any
}

export type QcloudAPICallback = (err: Error, res: QcloudAPIResponse) => void

export declare class QcloudAPIClass {
    constructor(options: QcloudAPIOptions)
    defaults: {
        protocol: 'https'
        baseHost: 'api.qcloud.com'
        path: '/v2/index.php'
        method: 'POST'
        serviceType: 'apigateway'
    } & Options
    request(
        data: {},
        opts: {},
        callback: QcloudAPICallback,
        extra?: {}
    ): void
}

export type StringBoolean = 'TRUE' | 'FALSE'

export interface Pager {
    limit?: number
    offset?: number
}

export type TotalCount = { totalCount: number }

export type CreatedTime = { createdTime?: string }
export type ModifiedTime = { modifiedTime?: string }
export type Timestamps = CreatedTime & ModifiedTime

export interface Service extends Timestamps {
    serviceId: string
    serviceName: string
    serviceDesc: string
    protocol: 'http' | 'https' | 'http&https'
    subDomain: string
    vailableEnvironments: any[]
}
export type ServiceStatus = Pick<Service, 'serviceId' | 'serviceName' | 'serviceDesc' | 'protocol' | 'subDomain' | 'vailableEnvironments'>

export interface ApiRequestConfig {
    method: string
    path: string
}
export interface ApiParameter {
    name: string
    desc: string
    position: 'HEADER' | 'BODY' | 'QUERY' | 'PATH'
}
export interface ApiConstantParameter extends ApiParameter {
    defaultValue: string
}
export interface ApiRequestParameter extends ApiParameter {
    defaultValue: string
    type: 'string' | 'int' | 'long' | 'float' | 'double' | 'boolean'
    required: StringBoolean
}
export interface ApiResponseErrorCode {
    code: string
    msg: string
    desc: string
}
export interface Api extends ApiRequestConfig, Timestamps, Pick<Service, 'serviceId'> {
    apiId: string
    apiName: string
    apiDesc: string
    serviceType: 'HTTP' | 'MOCK' | 'SCF'
    serviceTimeout: number // 1-1800s
    authRequired: StringBoolean
    requestConfig: ApiRequestConfig
    serviceScfFunctionName: string
    constantParameters: ApiConstantParameter[]
    requestParameters: ApiRequestParameter[]
    responseType: 'HTML' | 'JSON' | 'TEST' | 'BINARY' | 'XML'
    responseSuccessExample: string
    responseFailExample: string
    responseErrorCodes: ApiResponseErrorCode[]
    serviceMockReturnMessage: string
}
export type ApiStatus = Pick<Api, 'apiId' | 'serviceId' | keyof ApiRequestConfig | keyof Timestamps>

export type ServiceEnvironmentName = 'test' | 'prepub' | 'release'

export interface ServiceRelease extends Pick<Service, 'serviceId'> {
    releaseDesc: string
    environmentName: ServiceEnvironmentName
    releaseTime: string
}

export interface ServiceEnvironment {
    url: string
    environmentName: ServiceEnvironmentName
    status: 0 | 1
    versionName: string
}

export interface ServiceVersion {
    versionName: string
    versionDesc: string
    createTime: string
    environments: ServiceEnvironmentName[]
}

export interface UsagePlan extends Timestamps {
    usagePlanId: string
    usagePlanName: string
    usagePlanDesc: string
    maxRequestNumPreSec: number
    requestControlUnit: 'SECOND'
}
export interface UsagePlanBind extends UsagePlan {
    bindSecretIdTotalCount: number
    bindSecretIds: any[]
    bindEnvironmentTotalCount: number
    bindEnvironments: any[]
}
export type UsagePlanStatus = Pick<UsagePlan, 'usagePlanId' | 'usagePlanName' | 'usagePlanDesc' | 'maxRequestNumPreSec' | keyof Timestamps> & { maxRequestNum: null }
