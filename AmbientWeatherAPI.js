var http = require("http")
const aws = require("aws-sdk");

const REGION = "us-west-1"
aws.config.update({region:REGION})
const APP_KEY = "940eb4fa564345518ccbd0ebe402cd439ecfd1b0ce684615b773746978defc1e"
const db = new aws.DynamoDB()

function uuid() {
    var _sym = 'abcdefghijklmnopqrstuvwxyz1234567890'
    var str = '';

    for(var i = 0; i < 32; i++) {
        str += _sym[parseInt(Math.random() * (_sym.length))];
    }
    return str
}

exports.saveDeviceData = async function (device, apikey)
{
    device.Id = uuid()
    device.apikey = apikey
    device.Date = device.lastData.date
    var item = aws.DynamoDB.Converter.marshall(device)
    const params = {
        TableName: "AmbientWeatherStationData",
        Item: item,
    }

    await new Promise((resolve, reject) => {
        db.putItem(params, function(err, data) {
            if (err != null)
            {
                reject(err)
            }
            else
            {
                resolve(data)
            }
        })
    })
}

exports.getApiKeys = async function ()
{
    var params = {
        TableName : "AmbientWeatherUsers",
        // KeyConditionExpression: ""
    }
    return new Promise(function (resolve, reject) {
        db.scan(params, function (err, data){
            if (err != null)
            {
                reject(err)
            }
            else
            {
                var items = []
                for (var i = 0; i < data.Items.length; ++i)
                {
                    var item = aws.DynamoDB.Converter.unmarshall(data.Items[i])
                    items.push(item)
                }

                resolve(items)
            }
        })
    })
}
exports.getDeviceData = async function (macAddress, apikey)
{
    var params = {
        TableName : "AmbientWeatherStationData",
        ExpressionAttributeValues: {
            ':mac' : {S: macAddress},
            ':key' : {S: apikey}
        },
        FilterExpression: 'macAddress = :mac and apikey = :key'
    }
    return new Promise(function (resolve, reject) {
        db.scan(params, function (err, data){
            if (err != null)
            {
                reject(err)
            }
            else
            {
                var items = []
                for (var i = 0; i < data.Items.length; ++i)
                {
                    var item = aws.DynamoDB.Converter.unmarshall(data.Items[i])
                    items.push(item)
                }

                resolve(items)
            }
        })
    })
}


exports.getDevices = async function (apikey)
{
    var options = {
        host:'api.ambientweather.net',
        path:`/v1/devices?applicationKey=${APP_KEY}&apiKey=${apikey}`
    }

    return new Promise(function (resolve, reject) {

        var req = http.request(options, function(response) {
            var body = ""
            response.on("data", function(chunk) {
                body += chunk
            })
            response.on("end", function() {
                resolve(JSON.parse(body))
            })
            if (response.statusCode != 200)
            {
                reject(new Error(body))
            }
        }).end()

        req.on('error', function (e) {
            reject(e)
        })
    })
}


exports.saveUser = async function (user)
{
    var item = aws.DynamoDB.Converter.marshall(user)
    const params = {
        TableName: "AmbientWeatherUsers",
        Item: item,
    }

    await new Promise((resolve, reject) => {
        db.putItem(params, function(err, data) {
            if (err != null)
            {
                reject(err)
            }
            else
            {
                resolve(data)
            }
        })
    })
}