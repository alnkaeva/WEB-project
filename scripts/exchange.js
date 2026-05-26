const url = "https://www.cbr-xml-daily.ru/daily_json.js";

function showMainInfo() {
    let div = document.getElementById('cart');

    fetch(url)
        .then(function(response) {
            return response.json();
        })
        .then(function(json) {
            let current = json.Valute.DKK.Value;
            let previous = json.Valute.DKK.Previous;
            let diff = current - previous;
            let diffText;
            if (diff > 0) {
                diffText = 'поднялся на ' + diff.toFixed(4);
            } else if (diff < 0) {
                diffText = 'опустился на ' + Math.abs(diff).toFixed(4);
            } else {
                diffText = 'не изменился';
            }
            let date = new Date(json.Date).toLocaleString('ru-RU');

            let output = `
                <div class="euro-info">
                    <p><b>Курс датской кроны:</b> ${current.toFixed(4)} &#8381</p>
                    <p><b>Предыдущий курс:</b> ${previous.toFixed(4)} &#8381</p>
                    <p><b>Разница:</b> ${diffText}</p>
                    <p><b>Дата запроса:</b> ${date}</p>
                </div>
            `;
            div.innerHTML = output;
        })
}

function rubToDkk() {
    let rubInput = document.getElementById('rub-amount');
    let resultDiv = document.getElementById('rub-to-dkk-result');
    let rub = parseFloat(rubInput.value) || 0;

    fetch(url)
        .then(function(response) {
            return response.json();
        })
        .then(function(json) {
            let rate = json.Valute.DKK.Value;
            let dkk = rub / rate;
            resultDiv.innerHTML = `Результат: ${dkk.toFixed(2)} DKK`;
        })
}

function dkkToRub() {
    let dkkInput = document.getElementById('dkk-amount');
    let resultDiv = document.getElementById('dkk-to-rub-result');
    let dkk = parseFloat(dkkInput.value) || 0;

    fetch(url)
        .then(function(response) {
            return response.json();
        })
        .then(function(json) {
            let rate = json.Valute.DKK.Value;
            let rub = dkk * rate;
            resultDiv.innerHTML = `Результат: ${rub.toFixed(2)} &#8381`;
        })
}
const neededCount = 30;
let chartData = [];
let step = 0;
let dates = [];

function buildDates() {
    let today = new Date();
    dates = [];

    for (let i = 59; i >= 0; i--) {
        let d = new Date(today);
        d.setDate(today.getDate() - i);

        let y = d.getFullYear();
        let m = d.getMonth() + 1;
        let day = d.getDate();

        if (m < 10) {
            m = '0' + m;
        }
        if (day < 10) {
            day = '0' + day;
        }
        dates.push(y + '/' + m + '/' + day);
    }
}
function loadNext() {
    if (step === 0) {
        chartData = [];
    }

    if (step < dates.length) {
        if (chartData.length < neededCount) {
            let url = 'https://www.cbr-xml-daily.ru/archive/' + dates[step] + '/daily_json.js';
            fetch(url)
                .then(function(responce) {
                    return responce.json();
                })

                .then(function(json) {
                    chartData.push({ 
                        date: dates[step], 
                        rate: json.Valute.DKK.Value 
                    });
                    step = step + 1;
                    setTimeout(loadNext, 150);
                })

                .catch(function() {
                    step = step + 1;
                    setTimeout(loadNext, 150);
                });
        } else {
            drawChart();
        }
    } else {
        if (chartData.length > 0) {
            drawChart();
        } else {
            document.getElementById('diag').innerHTML = 'Нет данных';
        }
    }
}
function drawChart() {
    let container = document.getElementById('diag');
    container.innerHTML = '';

    if (chartData.length === 0) {
        container.innerHTML = 'Нет данных';
        return;
    }

    chartData.sort(function(a, b) {
        let dateA = new Date(a.date);
        let dateB = new Date(b.date);
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return 0;
    });

    let minRate = chartData[0].rate;
    let maxRate = chartData[0].rate;
    for (let i = 1; i < chartData.length; i++) {
        if (chartData[i].rate < minRate) {
            minRate = chartData[i].rate;
        }
        if (chartData[i].rate > maxRate) {
            maxRate = chartData[i].rate;
        }
    }

    let range = maxRate - minRate;
    if (range === 0) {
        range = 0.01;
    }

    const minHeight = 30;
    const maxHeight = 200;

    let wrapper = document.createElement('div');
    wrapper.className = 'columns-wrap';

    for (let i = 0; i < chartData.length; i++) {
        let rate = chartData[i].rate;
        let heightPx = minHeight + (rate - minRate) / range * (maxHeight - minHeight);
        if (heightPx < minHeight) {
            heightPx = minHeight;
        }
        if (heightPx > maxHeight) {
            heightPx = maxHeight;
        }

        let columnWrap = document.createElement('div');
        columnWrap.className = 'column-wrap';

        let column = document.createElement('div');
        column.className = 'column';
        column.style.height = heightPx + 'px';
        column.setAttribute('data-date', chartData[i].date);
        column.setAttribute('data-rate', rate);

        let label = document.createElement('div');
        label.className = 'column-label';
        let parts = chartData[i].date.split('/');
        label.innerText = parts[2] + '.' + parts[1];

        column.onclick = function() {
            let all = document.getElementsByClassName('column');
            for (let j = 0; j < all.length; j++) {
                all[j].classList.remove('selected');
            }
            this.classList.add('selected');
            let info = document.getElementById('infoBlock');
            if (!info) {
                info = document.createElement('div');
                info.id = 'infoBlock';
                info.className = 'info-block';
                container.parentNode.appendChild(info);
            }
            let date = this.getAttribute('data-date');
            let rateVal = parseFloat(this.getAttribute('data-rate'));
            info.innerHTML = 'Дата: ' + date + ' | Курс: ' + rateVal.toFixed(4) + ' &#8381';
        };

    
        column.onmouseenter = function() {
            let date = this.getAttribute('data-date');
            let rateVal = parseFloat(this.getAttribute('data-rate'));
            this.title = date + ' Курс: ' + rateVal.toFixed(4) + '  &#8381';
        };
        column.onmouseleave = function() {
            this.title = '';
        };

        columnWrap.appendChild(column);
        columnWrap.appendChild(label);
        wrapper.appendChild(columnWrap);
    }

    container.appendChild(wrapper);
}