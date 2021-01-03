const ambient = require("./AmbientWeatherAPI")

exports.handler = async (event) => {
    try {
        //Throws if the apikey used is not a valid one, causing use to not be saved
        var devices = await ambient.getDevices(event.user.apikey)

        await ambient.saveUser(event.user)
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
            body: e.message
        }
    }

};
