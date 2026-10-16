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
    const names = $('.person-checkbox:checked').map(function () {
        return this.id;
    }).get();
    const input = $('#count').val().trim().replace(/[０-９]/g, value => String.fromCharCode(value.charCodeAt(0) - 0xFEE0));
    if (!input) {
        $('#error-message').text('人数を入力してください');
        return;
    }
    const groupSizes = Array.from(input, Number).filter(Boolean);
    if (groupSizes.reduce((total, size) => total + size, 0) !== names.length) {
        $('#error-message').text(`人数が合いません (選択中: ${names.length}人)`);
        return;
    }
    const shuffledNames = shuffle(names);
    const result = [];
    let cur = 0;
    for (let i = 0; i < groupSizes.length; i++) {
        result[i] = shuffledNames.slice(cur, cur + groupSizes[i]);
        cur += groupSizes[i];
    }
    result.forEach(group => {
        $('<div>').text(group.join('、')).appendTo('#result-container');
    });
});