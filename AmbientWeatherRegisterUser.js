const ambient = require("./AmbientWeatherAPI")

exports.handler = async (event) => {
    try {
        //Use Proxy Integration
        var apikey = event.queryStringParameters.apikey
        //Throws if the apikey used is not a valid one, causing user to not be saved
        var devices = await ambient.getDevices(apikey)

        await ambient.saveUser({apikey:apikey, email:"", name: "" })
        const response = {
            statusCode: 200,
        };

        return response;
    }
    catch (e)
    {
        console.log(e)
        return {
            statusCode: 400,
            body: JSON.stringify({error: e.message})
        }
    }

};
