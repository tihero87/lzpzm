var gallery1 = new Gallery('gallery', {
    // включаем постраничную навигацию
    dots: true,
    // включаем управление с клавиатуры клавишами навигации "вправо / влево"
    //keyControl: true,
    // включаем адаптивность
    responsive: true,
    // настройки галереи в зависимости от разрешения
    adaptive: {
        // настройка работает в диапазоне разрешений 320-560px
        320: {
            // одновременно выводится 1 элемент
            visibleItems: 1,
            // расстояние между изображениями 5px
            nav: true,
            dots:true,
            margin: 9
        },
        // настройка работает в диапазоне разрешений 560-768px

        // настройка работает в диапазоне разрешений 1024 и выше
        1024: {
            // одновременно выводятся 4 элемента
            visibleItems: 1,

        }
    }
});

