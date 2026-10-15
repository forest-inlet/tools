const shuffle = (array) => {    
    const clone = Array.from(array);
    for (let i = clone.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [clone[i], clone[j]] = [clone[j], clone[i]];
    }
    return clone;
};

$('#run').on('click', () => {
    $('#error-message').text('');
    $('#result-container').empty();
    let names = $('.person-checkbox:checked').map(function () {
        return this.id;
    }).get();
    const input = $('#count').val().trim().replaceAll(/[０-９]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
    if (input == '') {
        $('#error-message').text('人数を入力してください');
        return;
    }
    const count_raw = input.split('').map(value => {
        if (!/^\d+$/.test(value)) {
            return NaN;
        }
        return parseInt(value);
    });
    console.log(count_raw);
    const count = count_raw.filter(e => !Number.isNaN(e) && e !== 0);
    console.log(count);
    if (count.reduce((acc, cur) => acc + cur, 0) !== names.length) {
        $('#error-message').text(`人数が合いません (選択中: ${names.length}人)`);
        return;
    }
    const shuffledNames = shuffle(names);
    const result = [];
    let cur = 0;
    for (let i = 0; i < count.length; i++) {
        result[i] = shuffledNames.slice(cur, cur + count[i]);
        cur += count[i];
    }
    result.forEach(e => {
        $('<div>').text(e.join('、')).appendTo('#result-container');
    })
});