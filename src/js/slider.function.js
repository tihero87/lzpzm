(function() {
    'use strict';

    var Gallery = function(id, setup) {
        // настройки по-умолчанию
        this.defaults = {
            margin:			0,		// расстояние между элементами [px]
            visibleItems: 	1,		// сколько элементов показывать одновременно
            border:			0,		// толщина рамки изображения прописанная в CSS [px]
            responsive:		true,	// адаптивная галерея
            autoScroll:		true,	// автоматическое прокручивание
            interval: 		3000,	// задержка при автоматическом прокручивании [ms]
            nav:			true,	// показать/скрыть кнопки next/prev
            dots:			true,	// показать/скрыть постраничную навигацию
            keyControl: 	false,	// управление клавишами вправо / влево
            animated:		true,	// включение анимации
            baseTransition:	1,	// скорость анимации, при изменении CSS свойств
            delayTimer:		200,	// время задержки при resize страницы [ms]
            limit:			0		// ограничиваем перемещение крайних элементов [px]
        };

        this.id = id;
        this.setup = setup;

        // основные DOM-элементы галереи определяющие её каркас
        // родительский элемент галереи
        this.gallery = document.getElementById(this.id);
        // контейнер в котором отображаются элементы галереи
        this.slider = this.gallery.querySelector('.slider');
        // контейнер, непосредственно в котором расположены элементы слайдера
        this.stage = this.gallery.querySelector('.stage');
        // элементы слайдера
        this.items = this.gallery.querySelectorAll('.stage > div');
        // количество элементов в слайдере
        this.count = this.items.length;

        this.current = 0;		// index координаты текущего элемента
        this.next = 0;			// index координаты следующего элемента
        this.pressed = false;	// указывает, что совершилось событие 'mousedown'
        this.start = 0;			// координата, с которой начато перетаскивание
        this.shift = 0;			// на сколько был перемещён курсор относительно start

        // построение галереи исходя из полученных настроек
        this.init();
    };

    // запишем конструктор в свойство 'window.Gallery', чтобы обеспечить
    // доступ к нему снаружи анонимной функции
    window.Gallery = Gallery;
    // для сокращения записи, создадим переменную, которая будет ссылаться
    // на прототип 'Gallery'
    var fn = Gallery.prototype;

    // настройка и инициализация галереи после изменения
    // текущей ширины страницы
    fn.resize = function() {
        // обнуляем таймер
        clearTimeout(this.resizeTimer);
        // чтобы уменьшить нагрузку, обработку изменившихся параметров производим
        // через заданный период времени, используя таймер-планировщик
        this.resizeTimer = setTimeout(function() {
            // инициализируем галерею с учётом нового разрешения экрана
            this.init();
            // получаем новый индекс текущего элемента
            this.current = (this.current <= this.max) ? this.current : this.max;
            // после изменения каркаса слайдера под новое разрешение,
            // находим новую координату текущего элемента
            var x = this.coordinates[this.current];
            // прокручиваем слайдер до элемента, который до начала ресайзинга
            // был текущим
            this.scroll.apply(this, [x, this.options.baseTransition]);
        }.bind(this), this.options.delayTimer);
        return;
    };

    fn.init = function() {
        this.options = extend({}, this.defaults, this.setup);

        // формируем каркас галереи
        this.setSizeCarousel();
        // заполняем массив с координатами X каждого элемента слайдера
        this.setCoordinates();
        // формируем управление слайдером в зависимости от настроек
        this.initControl();
        // устанавливаем обработчики событий, если ещё не устанавливались
        if (!this.events) {
            this.registerEvents();
        }
    };

    //формируем каркас галереи
    fn.setSizeCarousel = function() {
        // получаем ширину слайдера - вьюпорт, в котором прокручиваются элементы галереи
        this.widthSlider = this.slider.offsetWidth;

        // если разрешена адаптация галереи, то необходимо, используя свойство
        // 'options.adaptive', получить значения разрешений (контрольные точки),
        // при которых будут меняться количество видимых элементов галереи и
        // и другие её настройки
        if (this.options.responsive) {
            this.setAdaptiveOptions();
        }

        // максимальный индекс, который может быть у текущего элемента
        // чтобы на последней странице галереи при использовании пагинатора
        // наблюдалось кол-во элементов равное options.visibleItems
        this.max = this.count - this.options.visibleItems;

        // получаем ширину элемента слайдера, которая зависит от колличества
        // одновременно видимых элементов, размера отступа между элементами и
        // общей ширины слайдера
        // от ширины слайдера вычитаем сумму отступов
        // уменьшенную на 1, т.к. отступ последнего видимого элемента не попадает
        // в окно слайдера (контейнер '.stage')
        var width = (this.widthSlider - this.options.margin * (this.options.visibleItems - 1)) / this.options.visibleItems;

        // значение, по которому отсчитываются координаты
        // состоит из ширины элемента слайдера и его margin-right
        // другими словами - растоянием между левыми границами элементов слайдера
        this.width = width + this.options.margin;
        // ширина контейнера '.stage', непосредственно в котором
        // расположены элементы слайдера
        this.widths = this.width * this.count;
        // задаётся стиль ширины контейнера '.stage'
        this.stage.style.width = this.widths + 'px';
        // перебираем коллекцию элементов слайдера и
        // прописываем ширину и правый отступ для каждого элемента
        [].forEach.call(this.items, function(el) {
            el.style.cssText = 'width:' + width + 'px; margin-right:' + this.options.margin + 'px;';
        }.bind(this));

        // после того, как каркас галереи построен, все размеры элементов
        // вычислены и прописаны в стилях, делаем карусель видимой через
        // свойство стиля 'visibility'
        this.gallery.style.visibility = 'visible';
    };

    fn.setAdaptiveOptions = function() {
        var points	= [], // массив с контрольными точками
            point, // текущая контрольная точка
            // размер видимой части окна браузера
            width	= document.documentElement.clientWidth;

        // получаем массив из контрольных точек (break point)
        for (var key in this.options.adaptive) {
            points.push(key);
        }

        // сравнивая ширину страницы (документа) со значениями break point из массива,
        // определяем ближайшую контрольную точку 'снизу'. Эта точка будет служить
        // ключом к объекту с настройками для данного диапазона ширины страницы
        for (var i = 0, j = points.length; i < j; i++) {
            var a = points[i],
                b = (points[i + 1] !== undefined) ? points[i + 1] : points[i];

            if (width <= points[0]) {
                point = points[0];
            } else if (width >= a && width < b) {
                point = a;
            } else if (width >= points[points.length - 1]) {
                point = points[points.length - 1];
            }
        }

        // записываем полученные из object[point] настройки в options
        // данные настройки будут записаны поверх существующих
        var setting = this.options.adaptive[point];
        for (var key in setting) {
            this.options[key] = setting[key];
        }
        return;
    };

    // заполняем массив с коодинатами X каждого элемента слайдера
    fn.setCoordinates = function() {
        // координата первого элемента, от неё и будет идти отсчёт
        var point = 0;
        // добавляем новое свойство в объект 'options'
        // пока это пустой массив
        this.coordinates = [];

        // заполняем в цикле массив пока количество его элементов
        // не станет равно количеству элементов слайдера,
        // т.е. будет записана координата X каждого элемента
        while(this.coordinates.length < this.count) {
            // добавляем в конец массива текущее значение переменной 'point'
            // которое равно координате X текущего элемента слайдера
            this.coordinates.push(point);
            // вычитаем из текущей координаты ширину блока, равную
            // сумме ширины элемента слайдера и отступа или другими
            // словами - расстояние между левыми границами элементов
            point -= this.width;
        }
        return;
    };

    // формирования навигации галереи
    fn.initControl = function() {
        // объект с кнопками навигации 'prev / next'
        this.navCtrl = this.gallery.querySelector('.nav-ctrl');
        // объект перелистывания галереи с помощью пагинации
        this.dotsCtrl = this.gallery.querySelector('.dots-ctrl');

        if (this.options.nav === true) {
            // кнопка 'prev'
            this.btnPrev = this.navCtrl.querySelector('[data-shift=prev]');
            // кнопка 'next'
            this.btnNext = this.navCtrl.querySelector('[data-shift=next]');
            // устанавливаем стили для кнопок 'prev' и 'next'
            this.setNavStyle();
            // делаем навигацию видимой
            this.navCtrl.style.display = 'block';
        } else {
            // делаем навигацию невидимой
            this.navCtrl.removeAttribute('style');
        }

        if (this.options.dots === true) {
            // формируем постраничную навигацию
            this.creatDotsCtrl();
            // делаем постраничную навигацию видимой
            this.dotsCtrl.style.display = 'inline-block';
        } else {
            // делаем постраничную навигацию невидимой
            this.dotsCtrl.removeAttribute('style');
        }
    };

    fn.creatDotsCtrl = function() {
        // массив с элементы управления постраничной навигацией
        this.spots = [];
        // при ресайзе страницы удаляем элементы постраничной навигации, т.к
        // она будет перестроена исходя из новых настроек, актуальных для текущего
        // разрешения (ширины экрана)
        this.dotsCtrl.innerHTML = '';

        var i = 0,
            point = 0,
            // создаём элемент списка, внутри которых будут находится
            // элементы, управляющие постраничной навигацией
            li = document.createElement('li'),
            // создаём элемент span, который будет отображать точку
            span = document.createElement('span'),
            clone;

        // добавляем созданный элемент 'span' в элемент списка 'li'
        li.appendChild(span);
        while (i < this.count) {
            // создаём клон полученного элемента списка
            clone = li.cloneNode(true);
            // добавляем клон (элемент 'li') в конец объекта 'dotsCtrl'
            this.dotsCtrl.appendChild(clone);
            // и в массив
            this.spots.push(clone);

            // увеличиваем i на количество видимых элементов галереи
            i += this.options.visibleItems;
            // рассчитываем следующую координату Х, к которой необходимо прокрутить
            // слайдер при постраничной навигации
            point = (i <= this.max) ? point - this.width * this.options.visibleItems : -this.width * this.max;
        }
        this.setDotsStyle();
    };

    fn.setNavStyle = function() {
        // убираем у всех кнопок класс 'disable', теперь
        // обе кнопки выглядят активными
        this.btnPrev.classList.remove('disable');
        this.btnNext.classList.remove('disable');

        if (this.current == 0) {
            // если первый элемент является текущим, то блокируем попытку просмотра
            // предыдущего элемента, т.к. его не существует и делаем кнопку
            // 'prev' неактивной
            this.btnPrev.classList.add('disable');
        } else if (this.current >= this.count - this.options.visibleItems) {
            // если последний элемент появился на экране, при этом не важен
            // его индекс, блокируем и делаем неактивной кнопку просмотра след.
            // элемента на экране будет наблюдаться столько элементов,
            // сколько указано в visibleItems
            this.btnNext.classList.add('disable');
        }
        return;
    };

    fn.setDotsStyle = function() {
        // перебираем массив и делаем все элементы массива неактивными
        this.spots.forEach(function(item, i, spots) {
            item.classList.remove('active');
        });
        // находим индекс элемента, который необходимо сделать активным
        // метод Math.trunc() возвращает целую часть числа путём удаления всех дробных знаков.
        var index = (this.next < this.max) ? Math.trunc(this.next / this.options.visibleItems) : this.spots.length - 1;
        // добавляем класс элементу с найденным индексом
        this.spots[index].classList.add('active');
        return;
    };

    /////////////////////////////////////////
    // обработка событий управления галереей

    // регистрация обработчиков событий
    fn.registerEvents = function() {
        // регистрируем обработчик изменения размеров окна браузера
        window.addEventListener('resize', this.resize.bind(this));
        // автоматическое прокручивание, запускается установкой в настройках
        // значения свойства 'autoScroll' в true
        // т.к. мы делаем слайдер, а не карусель использовать автоскролл лучше
        // при выводе только одного изображения
        if (this.options.autoScroll) {
            setInterval(this.autoScroll.bind(this), this.options.interval);
        }
        // управление кликом по кнопкам 'prev / next' объекта 'navCtrl'
        this.navCtrl.addEventListener('click', this.navControl.bind(this));
        // управление постраничной навигацией точками
        this.dotsCtrl.addEventListener('click', this.dotsControl.bind(this));
        // управление клавишами вправо / влево
        // будет корректно работать, если на странице только одна галерея,
        // по умолчанию управление отключено
        if (this.options.keyControl) {
            window.addEventListener('keydown', this.keyControl.bind(this));
        }

        // mouse events
        // управление колёсиком мыши, управление работает, если указатель
        // мыши находится над DIV'ом с классом 'slider'
        //this.gallery.querySelector('.slider').addEventListener('wheel', this.wheelControl.bind(this));

        // нажатие кнопки мыши на слайдер
        this.stage.addEventListener('mousedown', this.tap.bind(this));
        // прокрутка слайдера перемещением мыши
        this.stage.addEventListener('mousemove', this.drag.bind(this));
        // отпускание кнопки мыши
        this.stage.addEventListener('mouseup', this.release.bind(this));
        // курсор мыши выходит за пределы DIV'а с классом 'slider'
        this.stage.addEventListener('mouseout', this.release.bind(this));

        // touch events
        // касание экрана пальцем
        this.stage.addEventListener('touchstart', this.tap.bind(this));
        // перемещение пальца по экрану (swipe)
        this.stage.addEventListener('touchmove', this.drag.bind(this));
        // палец отрывается от экрана
        this.stage.addEventListener('touchend', this.release.bind(this));

        // флаг, информирующий о том, что обработчики событий установлены
        this.events = true;
    };

    // автоматическое прокручивание галереи
    fn.autoScroll = function(e) {
        // получаем координату Х элемента, до которого должен переместиться слайдер
        // галерея всегда прокручивается вправо, поэтому аргумент, через который
        // передаётся direction, всегда равен 1
        var x = this.getNextCoordinates.call(this, 1);
        // запускаем прокручивание галереи
        this.scroll.apply(this, [x, this.options.baseTransition]);
        return;
    };

    // управление галерей кнопками 'prev / next'
    fn.navControl = function(e) {
        // если клик был сделан не по элементу 'span' объекта
        // navCtrl, прекращаем работу функции
        if (e.target.tagName != 'SPAN') return;
        // определяем направление прокручивания галереи
        // зависит от кнопки, по которой был сделан клик
        // -1 - prev, 1 - next
        var direction = (e.target.getAttribute('data-shift') == 'next') ? 1 : -1,
            // получаем координату Х элемента, до которого должен переместиться слайдер
            x = this.getNextCoordinates(direction);
        // запускаем прокручивание галереи
        this.scroll(x, this.options.baseTransition);
    };

    // пролистываем галерею на колличество видимых элементов
    // с помощью постраничной навигации
    fn.dotsControl = function(e) {
        // если клик был сделан не по элементу 'span' объекта dotsCtrl или
        // по активному элементу, соотвествующему текущей странице,
        // прекращаем работу функции
        if (e.target.tagName != 'SPAN' || e.target.parentNode.classList.contains('active')) return;

        // находим индекс элемента 'span' в массиве 'spots'
        // этот индекс понадобится для поиска координаты
        // в массиве 'coordinates'
        var index = this.spots.indexOf(e.target.parentNode);
        // если элемент в массиве 'spots' не найден, прекращаем работу функции
        if (index == -1) return false;
        // получаем индекс координаты, до которой будет прокручиваться галерея
        this.next = index * this.options.visibleItems;
        // ограничиваем индекс координаты, чтобы при переходе на последнюю страницу,
        // она была полностью заполнена, т.е. на последней странице должно быть
        // всегда visibleItems элементов
        this.next = (this.next <= this.max) ? this.next : this.max;
        // координата, до которой будет происходить scroll
        var x = this.coordinates[this.next];

        // вычисляем, на сколько элементов будет прокручена галерея
        var delta = Math.abs(this.current - this.next),
            // увеличиваем время анимации скролла в зависимости от количества
            // прокручиваемых элементов
            transition	= this.options.baseTransition + delta * 0.07;

        // запускаем прокручивание галереи
        this.scroll(x, transition);
    };

    // листаем галерею с помощью клавиатуры
    fn.keyControl = function(e) {
        var left = 37,	// код клавиши 'стрелочка влево'
            right = 39;	// код клавиши 'стрелочка вправо'
        // проверяем код нажатой клавиши и исходя из полученного
        // кода определяем направление прокручивания галереи
        // если код не соотвествует клавишам 'влево' или 'вправо',
        // прекращаем работу функции
        if (e.which !== right && e.which !== left) return;
        var direction = (e.which === right) ? 1 : -1,
            // получаем координату Х элемента, до которого должна переместиться галерея
            x = this.getNextCoordinates(direction);
        // запускаем прокручивание галереи
        this.scroll(x, this.options.baseTransition);
    };

    // листаем галерею вращая колёсико мыши
    fn.wheelControl = function(e) {
        // отключаем поведение по умолчанию - скролл страницы
        //e.preventDefault();
        // определяем направление перемещения в зависимости от направления
        // вращения колёсика мыши
        var direction = (e.deltaY > 0) ? 1 : -1;
        // получаем координату Х элемента, до которого должен переместиться слайдер
        var x = this.getNextCoordinates(direction);
        // запускаем прокручивание галереи
        this.scroll(x, this.options.baseTransition);
    };

    // обработчик нажатия левой кнопки мыши на слайдер или
    // касание (тап) пальцем
    fn.tap = function(e) {
        // отключаем действия по умолчанию
        //e.preventDefault();
        //e.stopPropagation();
        // если нажата не левая кнопка мыши, прекращаем работу функции
        if (event.which && event.which != 1) return;
        // расстояние от левой границы экрана до курсора без учета прокрутки,
        // т. е. начальная координата Х, с которой начато перетаскивание
        this.start = xpos(e);
        // устанавливаем флаг нажатия
        this.pressed = true;
        return;
    };

    // прокрутка слайдера перемещением мыши или перемещение пальца по экрану (swipe)
    fn.drag = function(e) {
        // отключаем действия по умолчанию
        //e.preventDefault();
        //e.stopPropagation();
        // 	// если не нажата левая кнопка мыши, прекращаем работу функции
        if (this.pressed === false) return;

        // смещение курсора мыши или пальца от начальной позиции
        this.shift = this.start - xpos(e);
        // исключаем дрожание курсора или пальца
        if (Math.abs(this.shift) < 3) return;
        // общая ширина всех невидимых в данный момент элементов слайдера
        var	remaining = this.widths - this.width * this.options.visibleItems,
            // разница между текущей координатой и смещением курсора от
            // точки старта, с которой начато перетаскивание
            delta = this.coordinates[this.current] - this.shift;
        // останавливаем прокручивание галереи при достижении первого или последнего элемента
        if (delta > this.options.limit || Math.abs(delta) - remaining > this.options.limit) return;

        // перемещаем слайдер на величину смещения курсора относитительно
        // точки старта (начальной координаты Х)
        this.scroll(delta, 0);
    };

    // отпускание кнопки мыши или палец отрывается от экрана
    // курсор мыши выходит за пределы DIV'а с классом 'slider'
    fn.release = function(e) {
        // отключаем действия по умолчанию
        //	e.preventDefault();
        //	e.stopPropagation();
        // 	// если не было нажатия на кнопку мыши или тапа пальцем,
        // 	// прекращаем работу функции
        if (this.pressed === false) return;
        // 	// рассчитываем направление прокрутки галереи
        //var direction = (Math.abs(this.shift) > this.width / (this.width/1.1)) ? Math.round(this.shift / this.width) : '';
        var direction = '';
        this.shift > 3 ? direction = 1 : direction = -1;
        // 	// определяем координату X ближайшего элемента
        var	x = this.getNextCoordinates(direction);
        // запускаем доводку прокручивания галереи к ближайшему элементу
        this.scroll(x, this.options.baseTransition);
        // сбрасываем флаг
        this.pressed = false;
    };

    /////////////////////////////////////////
    // прокручивание галереи

    // получаем новую координату, до которой должна проскроллиться галерея
    fn.getNextCoordinates = function(direction) {
        if (typeof(direction) !== 'number') return this.coordinates[this.current];

        // direction - направление перемещения: -1 - left, 1 - right
        if (this.options.autoScroll && this.current >= this.count - this.options.visibleItems) {
            this.next = 0;
        } else {
            // попытка прокрутить к предыдущему элементу, когда текущим является первый элемент
            if (this.current == 0 && direction == -1 ||
                // попытка просмотреть следующую группу элементов при постраничной навигации, но
                // все элементы после текущего выведены во вьюпорт слайдера
                (this.current >= this.max) && direction == 1) {
                return;
            }
            // получаем индекс следующего элемента
            this.next += direction;
        }
        // возвращаем координату след. элемента - координату, до которой
        // необходимо продвинуть галерею
        return this.coordinates[this.next];
    };

    // скроллинг галереи
    fn.scroll = function(x, transition) {
        // если аргумент х не является числом, прекращаем работу функции
        if (typeof(x) !== 'number') return;
        // прописываем новые стили для смещения (прокручивания) галереи
        // к следующему элементу
        this.stage.style.cssText =	'width:' + this.widths + 'px; ' +
            'height:' + this.items[0].offsetHeight + 'px; ' +
            'transform:translateX(' + x + 'px); ' +
            'transition:' + transition + 's';
        // после прокручивания, индекс след. элемента становится текущим
        this.current = (this.next < this.max) ? this.next : this.max;

        // меняем стили отображения кнопок управления в зависимости от
        // текущего индекса
        if (this.options.nav) this.setNavStyle();
        // меняем стили элементов постраничной навигации
        if (this.options.dots) this.setDotsStyle();
        return;
    };

    /////////////////////////////////////////

    // объединяет и перезаписывает значения двух объектов
    // и выдаёт общий результат
    function extend(out) {
        out = out || {};
        for (var i = 1; i < arguments.length; i++) {
            if (!arguments[i])
                continue;
            for (var key in arguments[i]) {
                if (arguments[i].hasOwnProperty(key))
                    out[key] = arguments[i][key];
            }
        }
        return out;
    };

    // возвращает координату Х текущего положения курсора
    // или пальца
    function xpos(e) {
        // 	// touch event
        // 	// проверяем, сформирован ли список точек на текущем элементе
        // 	// (список пальцев, которые вступили в контакт)
        if (e.targetTouches && (e.targetTouches.length >= 1)) {
            // 		// положение первой точки прикосновения, относительно левого края браузера
            return e.targetTouches[0].clientX;
        }
        // mouse event
        return e.clientX;
    }

})();






