const ambient = require("./AmbientWeatherAPI")
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

        let bucketValues = [new Date(sortedData[0].lastData.date)]
        let valuesByDay = [[]]

        //Partition data
        //The date
        for (let i = 0; i < sortedData.length; ++i)
        {
            //If the day differs
            let currentValueDate = new Date(sortedData[i].lastData.date)
            if (bucketValues[bucketValues.length -1].toDateString() != currentValueDate.toDateString())
            {
                bucketValues.push(currentValueDate)
                //Start next grouping
                valuesByDay[bucketValues.length -1] = []
            }

            valuesByDay[bucketValues.length -1].push(sortedData[i])
        }

        let aggregations = []
        //Aggregate the bucket
        for (let b = 0; b < valuesByDay.length; ++b)
        {
            const daysValues = valuesByDay[b]
            let average = 0
            let max = null
            let min = null

            for (let j = 0; j < daysValues.length; ++j)
            {
                const value = daysValues[j].lastData.tempf;

                average += value / daysValues.length

                if (max == null || value > max)
                {
                    max = value
                }

                if (min == null || value < min)
                {
                    min = value
                }
            }
            const day = new Date(daysValues[0].lastData.date)
            aggregations.push([day.toDateString(), average, max, min])
        }

        var html = "<html>\n<body>\n"
        html += "<table>\n"
        html += "<tr><td>Date</td> <td><b>Average</b></td> <td><b>Max</b></td> <td><b>Min</b></td></tr>\n"
        for(var n = 0; n < aggregations.length; ++n)
        {
            html += `<tr><td>${aggregations[n][0]} <td><b>${aggregations[n][1].toFixed(2)}</b></td> <td><b>${aggregations[n][2].toFixed(2)}</b></td> <td><b>${aggregations[n][3].toFixed(2)}</b></td></tr>\n`
        }
        html += "</table>\n"
        html += "</body>\n</html>"

        return html;
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
