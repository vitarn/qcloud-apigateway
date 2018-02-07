import * as path from 'path'
import * as fs from 'fs'
import test from 'ava'
import * as nock from 'nock'
import QcloudAPIGateway from '..'

interface NockBack extends nock.NockBack {
    (fixtureName: string, options: nock.NockBackOptions): Promise<{ nockDone, context }>
}

const pick = (obj = {}, ...keys) => keys.reduce((prev, key) => Object.assign(prev, { [key]: obj[key] }), {})
const pickObj = (obj = {}, pattern = {}) => pick(obj, ...Object.keys(pattern))
const omit = (obj = {}, ...keys) => Object.keys(obj).reduce((prev, key) => keys.includes(key) ? prev : Object.assign(prev, { [key]: obj[key] }), {})

nock.back.fixtures = path.join(__dirname, 'fixtures')
nock.back.setMode('record')

const { QCLOUD_SECRETID: SecretId = 'x', QCLOUD_SECRETKEY: SecretKey = 'x' } = process.env
const api = new QcloudAPIGateway({ SecretId, SecretKey })
const data = {
    service: {
        "serviceId": "service-qcy1662u",
        "serviceDesc": "A test service.",
        "serviceName": "test",
        "protocol": "http&https",
        "subDomain": "service-qcy1662u-1257654321.ap-guangzhou.apigateway.myqcloud.com",
        "availableEnvironments": [],
        "createdTime": "2018-02-06 17:28:58",
        "modifiedTime": "2018-02-06 17:28:58",
    },
    api: {
        "apiId": "api-n1avpll6",
        "apiName": "hello",
        "apiDesc": "A hello API.",
        "method": "GET",
        "path": "/hello",
        "requestConfig": {
            "method": "GET",
            "path": "/hello",
        },
        "authRequired": "TRUE",
        "serviceType": "MOCK",
        "serviceMockReturnMessage": "Hello!",
        "serviceTimeout": 30,
        "requestParameters": [],
        "responseType": "",
        "responseSuccessExample": "",
        "responseFailExample": "",
        "responseErrorCodes": [],
        "serviceId": "service-qcy1662u",
        "serviceName": "test",
        "serviceDesc": "A test service.",
        "createdTime": "2018-02-06 17:57:48",
        "modifiedTime": "2018-02-06 17:57:48",
    },
    release: {
        "releaseTime": "20180206215503e169e004-7be3-46fa-aea4-5a51fef7630d",
        "releaseDesc": "test",
    },
    usage: {
        "usagePlanId": "usagePlan-hhm84pad",
        "usagePlanName": "test",
        "usagePlanDesc": "test",
        "maxRequestNumPreSec": 1,
        "requestControlUnit": "SECOND",
        "createdTime": "2018-02-06 22:27:36",
        "modifiedTime": "2018-02-06 22:27:36",
        "bindSecretIdTotalCount": 0,
        "bindSecretIds": [],
        "bindEnvironmentTotalCount": 0,
        "bindEnvironments": [],
    }
}

test.beforeEach(async t => {
    const title = t.title.replace(/^beforeEach for /, '').trim()

    if (!title.startsWith('//')) return

    const fixture = `${title.slice(2)}.json`
    const { nockDone, context } = await (nock.back as NockBack)(fixture, {
        after: scope => {
            scope
                .persist()
                .filteringRequestBody((body, recordedBody) => {
                    if (typeof body !== 'string' || typeof recordedBody !== 'string') {
                        return body
                    }

                    const recordedPairs = recordedBody.split('&')
                    // Modify request body to match fixture.
                    return body.split('&')
                        .map(pair => {
                            if (/^(SecretId|Timestamp|Nonce|Signature)=/.test(pair)) {
                                return recordedPairs.find(
                                    p => p.startsWith(`${pair.split('=')[0]}=`)
                                )
                            }
                            return pair
                        })
                        .join('&')
                })
        },
        afterRecord: scopes => scopes.map(scope => {
            if (typeof scope.body === 'string') {
                scope.body = scope.body.replace(/SecretId=[0-9a-zA-Z]+/, 'SecretId=x')
            }

            // Erase AppID
            const eraseAppID = str => str.replace(/-125\d{7}\./, '-1257654321.')
            const { response } = scope
            if (response && response.codeDesc === 'Success') {
                const { data, subDomain, serviceStatusSet, environmentList } = response
                if (data) {
                    if (data.subDomain) {
                        data.subDomain = eraseAppID(data.subDomain)
                    }
                }
                if (subDomain) {
                    response.subDomain = eraseAppID(subDomain)
                }
                if (serviceStatusSet) {
                    serviceStatusSet.forEach(service => {
                        service.subDomain = eraseAppID(service.subDomain)
                    })
                }
                if (environmentList) {
                    environmentList.forEach(env => {
                        env.url = eraseAppID(env.url)
                    })
                }
            }

            return scope
        }),
    })

    t.context.nockDone = nockDone
    t.context.context = context
})

test.afterEach.always(t => {
    const { nockDone, context } = t.context

    if (context) context.assertScopesFinished()
    if (nockDone) nockDone()
})

test.after.always(t => {
    nock.cleanAll()
    nock.restore()
})

test('pick', t => {
    const obj = { a: 1, b: 2, c: 3 }

    t.deepEqual(pick(obj, 'a', 'b'), { a: 1, b: 2 })
})

test('pickObj', t => {
    const obj = { a: 1, b: 2, c: 3 }
    const pattern = { a: 11 }

    t.deepEqual(pickObj(obj, pattern), { a: 1 })
})

test('omit', t => {
    const obj = { a: 1, b: 2, c: 3 }
    const pattern = { a: 11 }

    t.deepEqual(omit(obj, 'a', 'b'), { c: 3 })
})

test('#constructor', t => {
    t.throws(() => new QcloudAPIGateway({}))
})

test('//request', async t => {
    let err = await t.throws(api.request({}), '请求失败，参数错误:[action]')

    t.is(err.name, 'ActionNotFound')
})

test('//createService', async t => {
    let res = await api.createService(pick(data.service,
        'protocol', 'serviceName', 'serviceDesc'))

    t.deepEqual(res, pickObj(data.service, res))
})

test('//describeServicesStatus', async t => {
    let res = await api.describeServicesStatus()

    t.is(res.totalCount, 1)
    t.is(res.serviceStatusSet.length, 1)

    let [first] = res.serviceStatusSet

    t.deepEqual(first, pickObj(data.service, first))
})

test('//describeService', async t => {
    let res = await api.describeService({ serviceId: data.service.serviceId })

    t.deepEqual(res, pickObj(data.service, res))
})

test('//modifyService', async t => {
    let modifiedServiceDesc = `${data.service.serviceDesc} Modified!`
    let res = await api.modifyService({
        serviceId: data.service.serviceId,
        serviceDesc: modifiedServiceDesc,
    })

    t.deepEqual(res.serviceDesc, modifiedServiceDesc)
    t.true(res.modifiedTime > data.service.modifiedTime)

    let res2 = omit(res, 'serviceDesc', 'modifiedTime')

    t.deepEqual(res2, pickObj(data.service, res2))
})

test('//createApi', async t => {
    let res = await api.createApi(pick(data.api, 'serviceId', 'apiName', 'apiDesc', 'requestConfig', 'serviceType', 'serviceMockReturnMessage'))

    t.deepEqual(res, pickObj(data.api, res))
})

test('//describeApisStatus', async t => {
    let res = await api.describeApisStatus({ serviceId: data.api.serviceId })

    t.is(res.totalCount, 1)
    t.is(res.apiIdStatusSet.length, 1)

    let [first] = res.apiIdStatusSet

    t.deepEqual(first, pickObj(data.api, first))
})

test('//describeApi', async t => {
    let res = await api.describeApi(pick(data.api, 'serviceId', 'apiId'))

    t.deepEqual(res, pickObj(data.api, res))
})

test('//releaseService', async t => {
    let res = await api.releaseService({
        serviceId: data.service.serviceId,
        releaseDesc: 'test',
        environmentName: 'test',
    })

    t.deepEqual(res, pickObj(data.release, res))
})

test('//describeServiceEnvironmentList', async t => {
    let res = await api.describeServiceEnvironmentList({ serviceId: data.service.serviceId })

    t.is(res.totalCount, 3)
    t.is(res.environmentList.length, 3)
    t.deepEqual(res.environmentList.map(env => env.environmentName), ['test', 'prepub', 'release'])
    t.deepEqual(res.environmentList.map(env => env.status), [1, 0, 0])
    t.deepEqual(res.environmentList.map(env => env.url), [
        `${data.service.subDomain}/test`, `${data.service.subDomain}/prepub`, `${data.service.subDomain}/release`
    ])
})

test('//describeServiceReleaseVersion', async t => {
    let res = await api.describeServiceReleaseVersion({ serviceId: data.service.serviceId })

    t.is(res.totalCount, 1)
    t.is(res.versionList[0].versionDesc, 'test')
    t.deepEqual(res.versionList[0].environments, ['test'])
})

test('//unReleaseService', async t => {
    let res = await api.unReleaseService({
        serviceId: data.service.serviceId,
        environmentName: 'test',
    })

    t.is(res.unReleaseDesc, null)
})

test('//createUsagePlan', async t => {
    let res = await api.createUsagePlan(pick(data.usage, 'usagePlanName', 'usagePlanDesc', 'maxRequestNumPreSec', 'requestControlUnit'))

    t.deepEqual(res, pickObj(data.usage, res))
})

test('//describeUsagePlan', async t => {
    let res = await api.describeUsagePlan({ usagePlanId: data.usage.usagePlanId })

    t.deepEqual(res, pickObj(data.usage, res))
})
