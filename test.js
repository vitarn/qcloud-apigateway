const test = require('ava')
const sinon = require('sinon')
const request = require('request')
const QcloudAPIGateway = require('.')

const api = () => new QcloudAPIGateway({ SecretId: 'x', SecretKey: 'x' })

test.beforeEach(t => {
    
})

test.afterEach.always(t => {
    if (t.context.mock) t.context.mock.restore()
})

test('#constructor', t => {
    t.throws(() => new QcloudAPIGateway({}))
})

test('#request', async t => {
    const mock = t.context.mock = sinon.mock(request)

    mock.expects('constructor').atLeast(1)

    t.truthy(await api().request({}))

    mock.verify()
})
