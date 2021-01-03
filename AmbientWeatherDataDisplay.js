const ambient = require("./AmbientWeatherAPI")

function partition(data, getValue)
{
    let bucketValues = [getValue(data[0])]
    let valuesByDay = [[]]

    //Partition data
    for (let i = 0; i < data.length; ++i)
    {
        //If the day differs
        let currentValueDate = getValue(data[i]) //new Date(sortedData[i].lastData.date)
        if (bucketValues[bucketValues.length -1] != currentValueDate)
        {
            bucketValues.push(currentValueDate)
            //Start next grouping
            valuesByDay[bucketValues.length -1] = []
        }

        valuesByDay[bucketValues.length -1].push(data[i])
    }

    return valuesByDay
}
function aggregate(data, init, aggregation)
{
    var acc = init
    for (let i = 0; i < data.length; ++i)
    {
        acc = aggregation(data[i], acc)
    }
    return acc
}
function toHtml(aggregations)
{
    var html = "<html>\n<body>\n"
    html += "<table>\n"
    html += "<tr><td>Date</td> <td><b>Average</b></td> <td><b>Max</b></td> <td><b>Min</b></td><td>Rain</td></tr>\n"
    for(var n = 0; n < aggregations.length; ++n)
    {
        html += `<tr><td>${aggregations[n].date}</td> <td><b>${aggregations[n].average.toFixed(0)}</b></td> <td><b>${aggregations[n].max.toFixed(0)}</b></td> <td><b>${aggregations[n].min.toFixed(0)}</b></td><td><b>${aggregations[n].rain.toFixed(0)}</b></td></tr>\n`
    }
    html += "</table>\n"
    html += "</body>\n</html>"

    return html
}

exports.handler = async (event) => {

    var macAddress = event.macAddress
    var apikey = event.apikey
    //https://tbndhxy0a2.execute-api.us-west-1.amazonaws.com/default/AmbientWeatherDataDisplay?apikey=7dce58d5f54a4ee78f21262bca5942fa4c56bce26d5b4bada34fd0907445b3b9&macAddress=48:3F:DA:54:C5:DA
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
            aggregations.push({date:day.toDateString(), average:average, max:max, min:min, rain:dailyRain})
        }

        //if (isJson)
        //{
            //return aggregations
        //}

        return toHtml(aggregations)
    }
    catch (e)
    {
        console.log(e)
        return {
            statusCode: 400,
            message: e.message,
            stack: e.stack
        }
    }
};
