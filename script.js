// Функция mainScript - главная функция, которая вызывается скриптом из HTML
/* Параметры: countRow-кол-во строк игрового поля, 
              countCol-кол-во колонок игрового поля,
              idSection - id секции, где размещаетются карточки игрового поля
              cardObj = {cssWrapper-родительский HTML-эл-т для карточки, 
                        cssWrapperTurnOpen - класс CSS для поворота карточки в открытое состояние,	
                        cssCard - CSS класс общий для верхней и нижней стороны карточки,
						cssCloseCard - CSS класс закрытой карточки
						cssOpenCard - CSS класс открытой карточки с символом emoji
				}
              idTimer - id таймера Timer
              htmlModalObj - объект с ID из модального окна (показывается в конце как рез-т игры)
*/
function mainScript({countRow, countCol, idSection, cardObj, idTimer, htmlModalObj})
{
	/*🐶 🐱 🐭 🐹 🐰 🐼*/
	cardSymbols = ['&#128054;', '&#128049;', '&#128045;', '&#128057;', '&#128048;', '&#128060;', '&#128054;', '&#128049;', '&#128045;', '&#128057;', '&#128048;', '&#128060;']; // символы-изображения на карточках
	let section = document.getElementById(idSection); // получение ссылки на элемент HTML, куда размещать игровое поле
	const modalWindow = document.getElementById(htmlModalObj.idModal); // получение ссылки на модульное окно
	const modalWin = document.getElementById(htmlModalObj.idWin); // Получение ссылки на эл-т DIV Win
	const modalLose = document.getElementById(htmlModalObj.idLose); // Получение ссылки на эл-т DIV Lose
	const btnPlayAgain = document.getElementById(htmlModalObj.idBtnPlayAgain); // Получение ссылки на кнопку Play Again
	const btnTryAgain = document.getElementById(htmlModalObj.idBtnTryAgain); // Получение ссылки на кнопку Try Again

	let arrayCards = []; // массив хранит объекты карточек
	let gameObject = null; // объект класса ClassGame
	let timerObj = null; // объект класса ClassTimer
	let GAME_TIME = 60000; // кол-во игрового времени
	let isFirstGame = true; // признак начального значения программы, старт 1-й игры


    // class ClassCard - класс для карточек {card, emoji - ссылки на соотв. DOM-элементы, status-статус карточки, redraw-"перерисовка" путем замены классов CSS}
    class ClassCard	{
    	constructor (card, emoji, symbolEmoji){
    		this.card = card;                        // ссылка на родительский элемент HTML карточки
    		this.emoji = emoji;                      // ссылка на элемент HTML, потомок, представляющий открытую сторону карточки с символом emoji
    		this.status = 0;                         // состояние карточки (0-закрыта, 1-открыта, 2-совпадающая карточка, 3-missed)
    		this.symbolEmoji = symbolEmoji;          // значение символа emoji, закрепленного за карточкой
    	}
    	redraw(){            // метод "перерисовки" карточки согласно status'у
    		let card = this.card; let emoji = this.emoji;

    		switch (this.status){
    			case 0: 
    			    card.classList.remove(cardObj.cssWrapperTurnOpen);
    			    break;
    			case 1: 
    				card.classList.toggle(cardObj.cssWrapperTurnOpen, true);
    				emoji.classList.remove(cardObj.cssCardMissed, cardObj.cssCardMatched);
    				break;
    			case 2: 
    				card.classList.toggle(cardObj.cssWrapperTurnOpen, true);
    				emoji.classList.remove(cardObj.cssCardMissed);
    				emoji.classList.toggle(cardObj.cssCardMatched, true);
    				break;
    			case 3: 
    				card.classList.toggle(cardObj.cssWrapperTurnOpen, true);
    				emoji.classList.remove(cardObj.cssCardMatched);
    				emoji.classList.toggle(cardObj.cssCardMissed, true);
    				break;
    		}
    		return null;
    	}
    }
    

    // ----------------------------
    // class Game - класс реализации логики игры
    class ClassGame {
    	constructor(){
    		this.testedCards = []; // сюда складываются ссылки на тестируемые карточки
    		this.redCards = [];    // missed cards (временное хранение)
    		this.nonResult = countRow*countCol / 2;       // изначально кол-во неугаданных карт = (countRow*countCol / 2), 3*4/2 = 6, уменьшается каждый раз при угадывании на 1
    		this.isGameStart = false; // false - игра не началась, true - игра началась
    	}
    	startGame(card){
    		if (!this.isGameStart){
    			this.isGameStart = true; // игра началась при первом нажатии карточки
    		}

    		let testedCards  = this.testedCards;
    		let redCards = this.redCards;
    		
    		if (card.status >= 2) // ==2 или ==3, оставляем все без изм-й, зеленая или икрасная карточка
    			return null;

    		// +++++++++++++
    		// Если карточка открыта, закрываем ее, для закрытия этой опции, исправить выше if (card.status >= 2) на if (card.status >= 1) и можно закомментировать этот блок
    		if (card.status === 1){
    			card.status = 0;
    			card.redraw();
    			testedCards.length = 0;
    			return null;
    		}
    		// +++++++++++++

    		// если карточка в момент клика закрыта
    		if (card.status === 0){
    			testedCards.push(card);
    			
    			// очистка красных карточек (перевод в исходное состояние)
    			if (redCards.length == 2){
    				redCards.forEach(function(elem){
    					elem.status = 0;
    					elem.redraw();
    				});
    				redCards.length = 0;
    			}

    			if (testedCards.length === 1){
    				card.status = 1;
    				card.redraw();
    				return null;
    			}

    			else if (testedCards.length === 2){ // кол-во тестируемых карт==2
    				if (testedCards[0].symbolEmoji.toString() === testedCards[1].symbolEmoji.toString()){
    					testedCards.forEach(function(elem){
    						elem.status = 2; // совпали (matched)
    						elem.redraw();
    					});
    					this.nonResult--; // уменьшаем кол-во неугаданных пар на 1
    					
    					if (this.nonResult === 0) {
    						//console.log('Победа'); 
    						return 1; // возвращает 1 в случае Победы WIN
    					}
    				}
    				else {
    					//redCards = testedCards.slice(0); // копируем во временный массив несовпавшие карточки
    					for(let i=0; i<testedCards.length; i++) redCards.push(testedCards[i]);

    					testedCards.forEach(function(elem){
    						elem.status = 3; // не совпали (missed)
    						elem.redraw();
    					});
    				}
    				
    				testedCards.length = 0;
    				return null;
    			}
    		}
    	} // startGame()

    }
    
    // ----------------------------
    /* Класс для таймера */
    class ClassTimer{
    	constructor(id, maxTime = 60000){
    		this.elTimer = document.getElementById(id);   // для связывания с соотв-м HTML-элементом
    		this.limitTime = maxTime;                     // максимальное время на игру 60000ms по умолчанию
    		this.currentTimeMS = maxTime;                   // текущее оставшееся время (изначально макс время на игру)
    		this.intervalID = null;                       // уникальный id таймера, возвращаемый setInterval()
    		this.timerReady = true;						  // таймер готов к запуску true, не готов - false
    	}
    	
    	// Запуск таймера
    	startTimer(){
    		this.intervalID = setInterval(function(){
    			this.currentTimeMS -= 1000;
    			this.displayCurrentTime();
    		}.bind(this), 1000);
    	}

    	// остановка таймера
    	stopTimer(){
    		clearInterval(this.intervalID); // Если время вышло, то останавливаем таймер
    		this.intervalID = null;
    	}

    	// отображение оставшегося количества секунд в элементе HTML аргумента elTimer
    	displayCurrentTime(){
    		if(this.currentTimeMS === 0){
    			this.stopTimer();

    			/* ВЫВОД МОДАЛЬНОГО ОКНА */
    			modalWindow.classList.toggle(htmlModalObj.cssVisibleClass, true);
    			modalLose.classList.toggle(htmlModalObj.cssVisibleClass, true);
    			btnTryAgain.classList.toggle(htmlModalObj.cssVisibleClass, true);
    		}

    		let countSeconds = this.currentTimeMS / 1000; // оставшееся число секунд
    		let viewMinutes = Math.floor(countSeconds / 60); // число минут для отображения
    		let viewSeconds = countSeconds % 60;             // число секунд для отображения

    		if (viewMinutes < 10) 
    			viewMinutes = '0' + viewMinutes.toString();
    		if (viewSeconds < 10) 
    			viewSeconds = '0' + viewSeconds.toString();

    		this.elTimer.innerHTML = viewMinutes.toString() + ' : ' + viewSeconds.toString();
    	}
    }

   // -----------------------------------------------------------------------------------------------------
   // Вспомогательная функция создает и возвращает элемент HTML
   /* Параметры:
   				tag-тег создаваемого элемента HTML
   				classTag - массив классов CSS для элемента tag (ВНИМАНИЕ! Передавать именно массив классов (оформлять как массив []), даже если класс всего 1)
   	  Возвращает: требуемый нам HTML элемент с заданными классами
   */
    function addCard(tag, classTags){
    	let elem = document.createElement(tag);

    	if (classTags !== undefined)
    		for(let i=0; i<classTags.length; i++){
    			elem.classList.add(classTags[i]);
    		}
    	
    	return elem;
    }
    // -----------------------------------------------------------------------------------------------------
    			
    			// ОСНОВНАЯ ПРОГРАММА

    // Вспомогательная функция возвращает случайный символ из набора
    function rndSymbol(arrSymbs){
    	let n = Math.floor(Math.random() * arrSymbs.length);
    	return arrSymbs.splice(n,1);  // возврат случайного символа emoji, с уменьшением массива arrSymbs
    }
    
    // Создание игрового поля из карточек размером countRow x countCol
    function gameCreateRestart(){
    		// У модального окна и его соотв-х эл-в убираем при наличии класс CSS видимости
    	modalWindow.classList.toggle(htmlModalObj.cssVisibleClass, false); // удаляем класс CSS видимости модального окна
    	modalWin.classList.toggle(htmlModalObj.cssVisibleClass, false); // удаляем класс CSS видимости Win
    	modalLose.classList.toggle(htmlModalObj.cssVisibleClass, false); // удаляем класс CSS видимости Lose
    	btnPlayAgain.classList.toggle(htmlModalObj.cssVisibleClass, false); // удаляем класс CSS видимости кнопки Play again
    	btnTryAgain.classList.toggle(htmlModalObj.cssVisibleClass, false); // удаляем класс CSS видимости кнопки Try again
    		// У модального окна и его соотв-х эл-в убираем при наличии класс CSS видимости

    	gameObject = new ClassGame(); // создание объекта ClassGame
    	timerObj = new ClassTimer(idTimer, GAME_TIME); // создание объекта класса ClassTimer
    	timerObj.displayCurrentTime(); // без отсчета, отсчет стартует с открытие м1-й карточки
    	let symbols = cardSymbols.slice(); // копируем массив символов для карточек, поскольку каждый раз мы его меняем ,исх-й оставляем как есть

    	if(isFirstGame){ // Если в первый раз, то создаем все эл-ты поля

    		for (let i=0; i<countRow; i++){
    			for(let j=0; j<countCol; j++){
    				let cardWrapper = addCard('DIV', [cardObj.cssWrapper]);
    				let elEmoji = addCard('DIV',[cardObj.cssCard, cardObj.cssOpenCard]); // создание элемента символ emoji внутри карточки
    				let elCard = addCard('DIV', [cardObj.cssCard, cardObj.cssCloseCard]); // Вызов функции создания элемента DIV карточки с классами                        

					let symbolEmoji = rndSymbol(symbols);
					elEmoji.innerHTML = symbolEmoji;

					cardWrapper.appendChild(elEmoji);                 // добавляем потомок elEmoji в карточку elCard
					cardWrapper.appendChild(elCard); 

					elCard.dataset.index = String(i*countCol+j);  // вспомогательные параметры (номер карточки), чтобы при делегировании события знать, где произошло событие
					elEmoji.dataset.index = String(i*countCol+j);
					cardWrapper.dataset.index = String(i*countCol+j);

					section.appendChild(cardWrapper);       // добавляем карточку в секцию HTML section
					
					arrayCards[i*countCol+j] = new ClassCard(cardWrapper, elEmoji, symbolEmoji);
				} // for(j)
			} // for(i)

			isFirstGame = false;
		}
		else{
			/* Если игра не в первый раз, то эл-ты заново не создаются (т.е. без reflow(!)), а просто назначаются новые символы и "переворачиваются" карточки (смена класса CSS) */
			arrayCards.forEach(function(element){
				element.status = 0; // статус закрытой карточки
				element.symbolEmoji = element.emoji.innerHTML = rndSymbol(symbols); // назначание случайного символа
				element.redraw(); // смена CSS класса на закрытый тип карточки
			});
		}

	} // EndOf gameCreateRestart()
	
	gameCreateRestart();





	// -----------------------------------------------------------------------------------------------------
	// Назначение обработки click'а на игровом поле (обрабатывается click на section с id=idSection)
	section.addEventListener('click', function(event){
		handlerClickCard(event); // обработчик события
	});

    
    // Функция обработчик события 'click' на секции игрового поля id=idSection
    function handlerClickCard(event){
    	event.stopPropagation();

    	if (event.target.tagName !== 'DIV') {
    		return null;   // нажатие произошло на поле за пределами карточек => выход из обработчика
    	}
    				
		if (gameObject.startGame(arrayCards[event.target.dataset.index]) === 1) // вызов обработки игровой ситуации, в случае победы возвращает 1
		{
			modalWindow.classList.toggle(htmlModalObj.cssVisibleClass, true); // вывод модального окна
    		modalWin.classList.toggle(htmlModalObj.cssVisibleClass, true);    // сообщение Win с анимацией
			btnPlayAgain.classList.toggle(htmlModalObj.cssVisibleClass, true);			  // кнопка Play again

    		timerObj.stopTimer();                                             // остановка таймера
    		return null;
		}

		if (gameObject.isGameStart && timerObj.timerReady){  // запуск таймера, если игра запущена isGameStart===true && таймер готов к запуску timerObj.timerReady == true
			timerObj.startTimer();
			timerObj.timerReady = false; // таймер переводится в состояние неготовности к повторному запуску
		}

    	return null;
    }
    // -----------------------------------------------------------------------------------------------------
    // Обработка 'click' на кнопке Play Again (запуск игры заново)
    btnPlayAgain.addEventListener('click', function(event){
    	gameCreateRestart();
    });
	// -----------------------------------------------------------------------------------------------------    
	btnTryAgain.addEventListener('click', function(event){
		gameCreateRestart();
	});
}