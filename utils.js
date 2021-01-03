
exports.partition = function (data, getValue)
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
exports.aggregate = function (data, init, aggregation)
{
    var acc = init
    for (let i = 0; i < data.length; ++i)
    {
        acc = aggregation(data[i], acc)
    }
    return acc
}