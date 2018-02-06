'use strict'

const QcloudAPI = require('qcloudapi-sdk')

class QcloudAPIGateway {
    /**
     * @param {{SecretId: string, SecretKey: string, Region: 'bj' | 'sh' | 'gz'}} options
     */
    constructor(options) {
        if (!options || !options.SecretId || !options.SecretKey) {
            throw new Error('SecretId and SecretKey is required!')
        }

        this.qcloudAPI = new QcloudAPI({
            SecretId: options.SecretId,
            SecretKey: options.SecretKey,
            serviceType: 'apigateway',
            Region: options.Region || 'gz',
        })
    }

    request(data, opts, extra) {
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
     * @typedef {object} ServiceStatus
     * @prop {string} serviceId
     * @prop {string} serviceName
     * @prop {string=} serviceDesc
     * @prop {string} subDomain
     * @prop {'http' | 'https' | 'http&https'} protocol
     * @prop {string} createdTime
     * @prop {string} modifiedTime
     * @prop {array} availableEnvironments
     * 
     * @typedef {object} DescribeServicesStatusRequest
     * @prop {number=} limit
     * @prop {number=} offset
     * 
     * @typedef {object} DescribeServicesStatusResponse
     * @prop {number} totalCount
     * @prop {[ServiceStatus]} serviceStatusSet
     * 
     * @param {DescribeServicesStatusRequest} params
     * @return {PromiseLike<DescribeServicesStatusResponse>}
     */
    describeServicesStatus(params) {
        return this.request({
            Action: 'DescribeServicesStatus',
        })
    }

    /**
     * @param {{serviceId: string}} params
     * @return {PromiseLike<ServiceStatus>}
     * @desc serviceId: `service-0abc0def`
     */
    describeService(params) {
        return this.request(Object.assign({}, params, {
            Action: 'DescribeService',
        }))
    }

    /**
     * @typedef {object} CreateServiceRequest
     * @prop {'http' | 'https' | 'http&https'} protocol
     * @prop {string=} serviceName
     * @prop {string=} serviceDesc
     * 
     * @typedef {object} CreateServiceResponse
     * @prop {string} createdTime
     * @prop {string} serviceName
     * @prop {string} subDomain
     * @prop {string} serviceId
     * @prop {string=} serviceDesc
     *
     * @param {CreateServiceRequest} params
     * @return {PromiseLike<CreateServiceResponse>}
     */
    createService(params) {
        return this.request(Object.assign({}, params, {
            Action: 'CreateService',
        }))
            .then(res => res.data)
    }

    /**
     * @typedef {object} ModifyServerRequest
     * @prop {string} serviceId
     * @prop {string=} protocol
     * @prop {string=} serviceName
     * @prop {string=} serviceDesc
     * 
     * @typedef {object} ModifyServiceResponse
     * @prop {string} serviceId
     * @prop {string} serviceName
     * @prop {string=} serviceDesc
     * @prop {string} protocol
     * @prop {string} modifiedTime
     * 
     * @param {ModifyServerRequest} params
     * @return {PromiseLike<ModifyServiceResponse>}
     */
    modifyService(params) {
        return this.request(Object.assign({}, params, {
            Action: 'ModifyService',
        }))
    }

    /**
     * @typedef {object} DeleteServiceRequest
     * @prop {string} serviceId
     * 
     * @param {DeleteServiceRequest} params
     * @return {PromiseLike<{requestId: null}>}
     */
    deleteService(params) {
        return this.request(Object.assign({}, params, {
            Action: 'DeleteService',
        }))
    }

    /**
     * @typedef {object} DescribeApisStatusRequest
     * @prop {string} serviceId
     * @prop {number=} limit
     * @prop {number=} offset
     * 
     * @typedef {object} DescribeApisStatusResponse
     * @prop {number} totalCount
     * @prop {{}[]} apiIdStatusSet
     * 
     * @param {DescribeApisStatusRequest} params
     * @return {PromiseLike<DescribeApisStatusResponse>}
     */
    describeApisStatus(params) {
        return this.request(Object.assign({}, params, {
            Action: 'DescribeApisStatus',
        }))
    }

    /**
     * @typedef {'TRUE' | 'FALSE'} StringBoolean
     * @typedef {'HTTP' | 'MOCK' | 'SCF'} ApiServiceType
     * @typedef {'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD'} ApiMethod
     * @typedef {'HEADER' | 'BODY' | 'QUERY' | 'PATH'} ApiParameterPosition
     * @typedef {'string' | 'int' | 'long' | 'float' | 'double' | 'boolean'} ApiParameterType
     * @typedef {'HTML' | 'JSON' | 'TEST' | 'BINARY' | 'XML'} ApiResponseType
     * 
     * @typedef {object} ApiConstantParameter
     * @prop {string} name
     * @prop {string} defaultValue
     * @prop {string} desc
     * @prop {ApiParameterPosition} position
     * 
     * @typedef {object} ApiRequestParameter
     * @prop {string} name
     * @prop {ApiParameterPosition} position
     * @prop {ApiParameterType} type
     * @prop {} defaultValue
     * @prop {StringBoolean} required
     * @prop {string=} desc
     * 
     * @typedef {object} ResponseErrorCode
     * @prop {string} code
     * @prop {string} msg
     * @prop {string} desc
     * 
     * @typedef {object} CreateApiRequest
     * @prop {string} serviceId
     * @prop {string} apiName
     * @prop {string=} apiDesc
     * @prop {ApiServiceType} serviceType
     * @prop {number=} [serviceTimeout=15] - 1-1800s
     * @prop {StringBoolean} [authRequired='TRUE']
     * @prop {{path: string, method: ApiMethod}} requestConfig
     * @prop {string} serviceScfFunctionName
     * @prop {[ApiConstantParameter]} constantParameters
     * @prop {[ApiRequestParameter]} requestParameters
     * @prop {ApiResponseType} responseType
     * @prop {string} responseSuccessExample
     * @prop {string} responseFailExample
     * @prop {ResponseErrorCode} responseErrorCodes
     * @prop {string} serviceMockReturnMessage
     * 
     * @typedef {object} CreateApiResponse
     * @prop {string} apiId
     * @prop {string} path
     * @prop {ApiMethod} method
     * @prop {string} createdTime
     * 
     * @param {CreateApiRequest} params
     * @return {PromiseLike<CreateApiResponse>}
     * 
     * @desc
     *  params.serviceTimeout 1-1800s
     */
    createApi(params) {
        return this.request(Object.assign({}, params, {
            Action: 'CreateApi',
        }))
    }

    /**
     * @typedef {object} ModifyApiRequest
     * @prop {string} serviceId
     * @prop {string} apiId
     * @prop {string} apiName
     * @prop {string=} apiDesc
     * @prop {ApiServiceType} serviceType
     * @prop {number=} [serviceTimeout=15] - 1-1800s
     * @prop {StringBoolean} [authRequired='TRUE']
     * @prop {{path: string, method: ApiMethod}} requestConfig
     * @prop {string} serviceScfFunctionName
     * @prop {[ApiConstantParameter]} constantParameters
     * @prop {[ApiRequestParameter]} requestParameters
     * @prop {ApiResponseType} responseType
     * @prop {string} responseSuccessExample
     * @prop {string} responseFailExample
     * @prop {ResponseErrorCode} responseErrorCodes
     * @prop {string} serviceMockReturnMessage
     * 
     * @param {ModifyApiRequest} params
     * @return {PromiseLike<{}>}
     */
    modifyApi(params) {
        return this.request(Object.assign({}, params, {
            Action: 'ModifyApi',
        }))
    }

    /**
     * @param {{serviceId: string, apiId: string}} params
     * @return {PromiseLike<{}>}
     */
    deleteApi(params) {
        return this.request(Object.assign({}, params, {
            Action: 'DeleteApi',
        }))
    }

    /**
     * @typedef {'test' | 'prepub' | 'release'} ServiceEnvironmentName
     * 
     * @typedef {object} ReleaseServiceRequest
     * @prop {string} serviceId
     * @prop {ServiceEnvironmentName} environmentName
     * @prop {string} releaseDesc
     * 
     * @typedef {object} ReleaseServiceResponse
     * @prop {string} releaseTime
     * @prop {string} releaseDesc
     * 
     * @param {ReleaseServiceRequest} params
     * @return {PromiseLike<ReleaseServiceResponse>}
     */
    releaseService(params) {
        return this.request(Object.assign({}, params, {
            Action: 'ReleaseService',
        }))
    }

    /**
     * @typedef {object} ServiceEnvironment
     * @prop {string} url
     * @prop {ServiceEnvironmentName} environmentName
     * @prop {number} status
     * @prop {string} versionName
     * 
     * @typedef {object} DescribeServiceEnvironmentListResponse
     * @prop {3} totalCount
     * @prop {[ServiceEnvironment]} environmentList
     * 
     * @param {{serviceId: string}} params
     * @return {PromiseLike<DescribeServiceEnvironmentListResponse>}
     */
    describeServiceEnvironmentList(params) {
        return this.request(Object.assign({}, params, {
            Action: 'DescribeServiceEnvironmentList',
        }))
    }

    /**
     * @param {{serviceId: string, environmentName: ServiceEnvironmentName}} params
     * @return {PromiseLike<>}
     */
    unReleaseService(params) {
        return this.request(Object.assign({}, params, {
            Action: 'UnReleaseService',
        }))
    }

    /**
     * @typedef {object} ServiceVersion
     * @prop {string} versionName
     * @prop {string} versionDesc
     * @prop {string} createTime
     * @prop {[ServiceEnvironmentName]} environments
     * 
     * @typedef {object} DescribeServiceReleaseVersionRequest
     * @prop {string} serviceId
     * @prop {number=} limit
     * @prop {number=} offset
     * 
     * @typedef {object} DescribeServiceReleaseVersionResponse
     * @prop {number} totalCount
     * @prop {[ServiceVersion]} versionList
     * 
     * @param {DescribeServiceReleaseVersionRequest} params
     * @return {PromiseLike<DescribeServiceReleaseVersionResponse>}
     */
    describeServiceReleaseVersion(params) {
        return this.request(Object.assign({}, params, {
            Action: 'DescribeServiceReleaseVersion',
        }))
    }
}

module.exports = QcloudAPIGateway
