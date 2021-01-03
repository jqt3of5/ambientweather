const ambient = require("./AmbientWeatherAPI.js")

exports.handler = async (event) => {
    try {

        var apikeys = await ambient.getApiKeys()
        for (var i = 0; i < apikeys.length; ++i)
        {
            var devices = await ambient.getDevices(apikeys[i].apikey)

            for(var j = 0; j < devices.length; ++j)
            {
                await ambient.saveDeviceData(devices[j], apikeys[i].apikey)
            }
        }

        const response = {
            statusCode: 200,
        };

        return response;
    }
    catch (e)
    {
        console.log(e)
        return {
            statusCode: 500,
            body: e.message
        }
    }

};
