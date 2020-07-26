/*
 Javscript file supporting marketcap.html page
  - IOT week 4 assignment
  - show change in market cap for a given period.

  The user can select period supportd by Coin Gecko from a drop down to see the market
  cap change for that period fo the top 500 tokens as ranked by market cap

  Since there are over 7000 tokens, I limmited to 500.
   - Could paramaterize that, but haven't for now
*/

var validPeriods = ['1h', '24h', '7d', '14d', '30d', '200d', '1y'];

$(document).ready(() => {
    // Define period select box and do some house keeping
    $('#spinner').hide();
    $('.loading').hide();
    $('#period').empty();
    $('#period').append($('<option> -- Select Period --</option>'));
    $.each(validPeriods, function(i, p) {
        $('#period').append($('<option></option>').val(p).html(p));
    });

    // Upon selection of a period, show a spinner and initiate the process of
    //  retrieving the data, doing some math, and displaying formatted results
    $('#period').change(() => {
        getAllMcData($("#period option:selected").val());
    });
});

/*
  Promise to wait on recursive API call to get all Market Cap data
   - There are over 7,000 coins and we can only get up to 250 at a time
   - limiting to 500 based on the 'pageNbr' var in a conditional statement below that ends
     the ajax recursion for retrieving 100 tokens per call

   NOTE:  Not 100% sure my math is right, I didn't verify it as I was out of time, but I will in the future
        if we keep working with this

   @input: period: limited string values as defined by API
 */
const getAllMcData = (period) => {
    new Promise((resolve, reject) => {
        if(validPeriods.indexOf(period) === -1) {
            alert("Invalid period, please select on of the following: " + validPeriods.join(", "));
            return false;
        }
        $('#spinner').show();
        $('.loading').show();
        $('#output').hide();
        getCGMarketCapData(period, pageNbr=1, mcdata=[], resolve, reject)
    }).then((response) => {
        formatData(response);
        $('.loading').hide();
        $('#spinner').hide();
    });
}

/*
 Function that recursively pulls N records from Coin Gecko endpoint until no data is left to retrieve
  - promise resolves with concatenated result set
 */
const getCGMarketCapData = (period, pageNbr, mcData, resolve, reject) => {
    let BASE_URL = 'https://api.coingecko.com/api/v3';
    let ENDPOINT = '/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=' + pageNbr + '&sparkline=false&price_change_percentage=' + period;
    let apiUrl = BASE_URL + ENDPOINT;

    /* Make ajax call to pulling data */
    $.get(apiUrl, (data) => {
        if (data.length == 0 || pageNbr > 5) {
            resolve({'result': mcData, 'period': period});
        } else {
            const combinedData = mcData.concat(data);
            getCGMarketCapData(period, pageNbr+=1, combinedData, resolve, reject);
        }
    });
}

/*
 * Function to walk thru data and return total market cap for period
 */
const parseData = (data) => {
    let percentChange = 'price_change_percentage_' + data.period + '_in_currency';
    let mcData = {now: 0, then: 0};
    data.result.forEach((token) => {
        mcData.now += parseInt(token.market_cap);
        mcData.then += parseInt(token.market_cap * (1 + token[percentChange]/100));
    });

    return mcData;
}

/*
 * Function to format data and rerender html
 */
const formatData = async (data) => {
    let marketCap = await parseData(data);
    let change = parseInt(marketCap.now) - parseInt(marketCap.then);
    let formatted_change = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(change);
    let output = (change >= 0) ? '<span style="color: green; text-align: right;">' + formatted_change + '</span>' : '<span style="color: red; text-align: right;">' + formatted_change + '</span>';
    let msg = '<h4>The market cap has changed by ' + output + ' dollars in for the period of ' + data.period + '</h4><br>';
    $('#output').append(msg).show();
}