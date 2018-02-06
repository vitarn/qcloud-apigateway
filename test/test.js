const path = require('path')
const fs = require('fs')
const test = require('ava')
const nock = require('nock')
const QcloudAPIGateway = require('..')

const pick = (obj = {}, ...keys) => keys.reduce((prev = {}, key) => Object.assign(prev, { [key]: obj[key] })) 

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
        "authRequired": "TRUE",
        "serviceId": "service-qcy1662u",
        "createdTime": "2018-02-06 17:57:48",
        "modifiedTime": "2018-02-06 17:57:48",
    }
}

test.beforeEach(async t => {
    const fixture = t.title.replace(/^beforeEach for /, '') + '.json'
    const { nockDone, context } = await nock.back(fixture, {
        after: scope => scope
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
            }),
        afterRecord: scopes => scopes.map(scope => {
            if (typeof scope.body === 'string') {
                scope.body = scope.body.replace(/SecretId=[0-9a-zA-Z]+/, 'SecretId=x')
            }

            // Erase AppID
            const eraseAppID = str => str.replace(/-125\d{7}\./, '-1257654321.')
            const { response } = scope
            if (response && response.codeDesc === 'Success') {
                const { data, subDomain, serviceStatusSet } = response
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
            }

            return scope
        }),
    })

    t.context.nockDone = nockDone
    t.context.context = context
})

test.afterEach.always(t => {
    t.context.context.assertScopesFinished()
    t.context.nockDone()
})

test.after.always(t => {
    nock.cleanAll()
    nock.restore()
})

test('constructor', t => {
    t.throws(() => new QcloudAPIGateway({}))
})

test('request', async t => {
    let err = await t.throws(api.request({}), '请求失败，参数错误:[action]')

    t.is(err.name, 'ActionNotFound')
})

test('createService', async t => {
    // let res = await api.createService({
    //     protocol: data.service.protocol,
    //     serviceName: data.service.serviceName,
    //     serviceDesc: data.service.serviceDesc,
    // })
    console.log(pick(data.service,
        'protocol', 'serviceName', 'serviceDesc'))
    let res = await api.createService(pick(data.service,
        'protocol', 'serviceName', 'serviceDesc'))

    Object.keys(res).forEach(key => t.deepEqual(res[key], data.service[key]))
})

test('describeServicesStatus', async t => {
    let res = await api.describeServicesStatus()

    t.is(res.totalCount, 1)
    t.is(res.serviceStatusSet.length, 1)

    let [first] = res.serviceStatusSet

    Object.keys(first).forEach(key => t.deepEqual(first[key], data.service[key]))
})

test('describeService', async t => {
    let res = await api.describeService({ serviceId: data.service.serviceId })

    Object.keys(res).forEach(key => t.deepEqual(res[key], data.service[key]))
})

test('modifyService', async t => {
    let modifiedServiceDesc = `${data.service.serviceDesc} Modified!`
    let res = await api.modifyService({
        serviceId: data.service.serviceId,
        serviceDesc: modifiedServiceDesc,
    })

    Object.keys(res).forEach(key => {
        if (key === 'serviceDesc') {
            t.deepEqual(res[key], modifiedServiceDesc)
        } else if (key === 'modifiedTime') {
            t.true(res[key] > data.service[key])
        } else {
            t.deepEqual(res[key], data.service[key])
        }
    })
})

test('createApi', async t => {
    let res = await api.createApi({
        serviceId: data.api.serviceId,
        apiName: data.api.apiName,
        apiDesc: 'A hello API.',
        requestConfig: {
            method: 'GET',
            path: '/hello',
        },
        serviceType: 'MOCK',
        serviceMockReturnMessage: 'Hello!',
    })

    t.pass()
})

test('describeApisStatus', async t => {
    let res = await api.describeApisStatus({ serviceId: data.api.serviceId })

    t.pass()
})
