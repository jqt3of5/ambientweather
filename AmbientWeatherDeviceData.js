const ambient = require("./AmbientWeatherAPI")
const {aggregate, partition} = require("./utils")

exports.handler = async (event) => {

    //Using Proxy integration
    var macAddress = event.pathParameters.macAddress
    var apikey = event.queryStringParameters.apikey

    //apikey=7dce58d5f54a4ee78f21262bca5942fa4c56bce26d5b4bada34fd0907445b3b9
    //48:3F:DA:54:C5:DA

    //TODO: Admittedly not very efficient to regenerate this data every time we request it. Would be better to cache it.
    try {
        let deviceData = await ambient.getDeviceData(macAddress, apikey)

        let sortedData = deviceData.sort(function(a, b){
            if (a.lastData.date == b.lastData.date)
            {
                return 0
            }
            return a.lastData.date > b.lastData.date ? 1 : -1
        })

        let valuesByDay = partition(sortedData, function(value) {
            var date = new Date(value.lastData.date)
            date.setHours(date.getHours() - 7)
            return date.toDateString()
        })

        let aggregations = []
        //Aggregate the bucket
        for (let b = 0; b < valuesByDay.length; ++b)
        {
            const daysValues = valuesByDay[b]
            let average = aggregate(daysValues, 0, function(val, acc) {
                return acc + val.lastData.tempf/daysValues.length
            })

            let max = aggregate(daysValues, null, function(val, acc) {
                if (acc === null || val.lastData.tempf > acc)
                {
                    return val.lastData.tempf
                }
                return acc
            })

            let min = aggregate(daysValues, null, function(val, acc) {
                if (acc === null || val.lastData.tempf < acc)
                {
                    return val.lastData.tempf
                }
                return acc
            })

            const day = new Date(daysValues[0].lastData.date)
            const dailyRain = daysValues[daysValues.length - 1].lastData.dailyrainin
            aggregations.push({date:day, average:average, max:max, min:min, rain:dailyRain})
        }

        return {
            statusCode: 200,
            body: JSON.stringify(aggregations)
        }
    }
    catch (e)
    {
        console.log(e)
        return {
            statusCode: 400,
            body: JSON.stringify({error: e.message, stack: e.stack})
        }
    }
};
