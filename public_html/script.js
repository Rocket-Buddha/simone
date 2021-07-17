CONFIG = {
    COUNTWIN: 20,
    FAILTIMESSHOW: 3,
    WINLAPSSHOW: 3,
    PULSERTIME: 3000
};

PUSHER = {
    GREEN: 1,
    RED: 2,
    YELLOW: 3,
    BLUE: 4
};

DIFFICULTY = {
    ONE: {ONTIME: 1000, OFFTIME: 500},
    TWO: {ONTIME: 750, OFFTIME: 375},
    THREE: {ONTIME: 500, OFFTIME: 250}
};

GAMESTATE = {
    STOPED: 'STOPED',
    MACHINETURN: 'MACHINETURN',
    HUMANTURN: 'HUMANTURN',
    FAILSHOW: 'FAILSHOW',
    WINSHOW: 'WINSHOW'
};

var Subject = function () {

    this.notify = function () {
        for (var i = 0; i < suscribers.length; i++) {
            suscribers[i].refresh();
        }
    };

    this.addSuscriber = function (_suscriber) {
        suscribers.push(_suscriber);
    };

    var suscribers = [];
};

var GameModel = function () {

    if (GameModel.prototype.INSTANCE) {
        return GameModel.prototype.INSTANCE;
    } else {

        //singleton instance
        GameModel.prototype.INSTANCE = this;

        /*
         extends
         pattern reference http://www.bolinfest.com/javascript/inheritance.php
         */
        var root = new Subject();
        this.addSuscriber = function (_suscriber) {
            root.addSuscriber(_suscriber);
        };
        var notify = function () {
            root.notify();
        };

        //getters
        this.getDifficulty = function () {
            return difficulty;
        };

        this.getGamestate = function () {
            return gameState;
        };

        this.getStrictMode = function () {
            return strictMode;
        };

        this.getPusherGreen = function () {
            return pusherGreen;
        };

        this.getPusherRed = function () {
            return pusherRed;
        };

        this.getPusherYellow = function () {
            return pusherYellow;
        };

        this.getPusherBlue = function () {
            return pusherBlue;
        };

        this.getCount = function () {
            return currentGame.length - 1;
        };

        //properties
        this.pushDifficulty = function () {
            //if (gameState === GAMESTATE.STOPED)
            if (difficulty === DIFFICULTY.THREE)
                difficulty = DIFFICULTY.ONE;
            else if (difficulty === DIFFICULTY.ONE)
                difficulty = DIFFICULTY.TWO;
            else if (difficulty === DIFFICULTY.TWO)
                difficulty = DIFFICULTY.THREE;
            notify();
        };

        this.pushStrict = function () {
            //if (gameState === GAMESTATE.STOPED)
            strictMode ? strictMode = false : strictMode = true;
            notify();
        };

        this.pushStart = function () {
            clearTimeout(timerId);
            gameState = GAMESTATE.MACHINETURN;
            currentGame = [Math.floor((Math.random() * 4) + 1)];
            revisionIndex = 0;
            setOff();
            timerId = setTimeout(function () {
                doMachineTurn();
            }, 1500);
        };

        this.holdStart = function () {
            clearTimeout(timerId);
            gameState = GAMESTATE.STOPED;
            currentGame = [Math.floor((Math.random() * 4) + 1)];
            revisionIndex = 0;
            setOff();
        };

        this.pushPusher = function (_pusher) {
            if (gameState === GAMESTATE.HUMANTURN) {
                switch (_pusher) {
                    case PUSHER.GREEN:
                        pusherGreen = true;
                        break;
                    case PUSHER.RED:
                        pusherRed = true;
                        break;
                    case PUSHER.YELLOW:
                        pusherYellow = true;
                        break;
                    case PUSHER.BLUE:
                        pusherBlue = true;
                }
                notify();
                if (_pusher === currentGame[revisionIndex]) {
                    timerId = setTimeout(function () {
                        setOff();
                    }, 200);
                    if (currentGame.length - 1 !== revisionIndex) {
                        revisionIndex++;
                    } else {
                        revisionIndex = 0;
                        if (currentGame.length === CONFIG.COUNTWIN) {
                            gameState = GAMESTATE.WINSHOW;
                            timerId = setTimeout(function () {
                                showWin(CONFIG.WINLAPSSHOW, PUSHER.YELLOW);
                            }, 100);
                        } else {
                            currentGame.push(Math.floor((Math.random() * 4) + 1));
                            gameState = GAMESTATE.MACHINETURN;
                            timerId = setTimeout(function () {
                                doMachineTurn();
                            }, 1500);
                        }
                    }
                } else {
                    if (strictMode) {
                        revisionIndex = 0;
                        currentGame = [Math.floor((Math.random() * 4) + 1)];
                        gameState = GAMESTATE.FAILSHOW;
                        showFail(CONFIG.FAILTIMESSHOW);
                    } else {
                        revisionIndex = 0;
                        gameState = GAMESTATE.FAILSHOW;
                        showFail(CONFIG.FAILTIMESSHOW);
                    }
                }
            }
        };

        var doMachineTurn = function () {
            showGame(0);
        };

        var showGame = function (_index) {
            switch (currentGame[_index]) {
                case PUSHER.GREEN:
                    pusherGreen = true;
                    break;
                case PUSHER.RED:
                    pusherRed = true;
                    break;
                case PUSHER.YELLOW:
                    pusherYellow = true;
                    break;
                case PUSHER.BLUE:
                    pusherBlue = true;
            }
            notify();
            timerId = setTimeout(function () {
                terminateCurrentShow(_index);
            }, difficulty.ONTIME);
        };

        var terminateCurrentShow = function (_index) {
            setOff();
            lastOneFlag = (_index === currentGame.length - 1);
            if (lastOneFlag) {
                gameState = GAMESTATE.HUMANTURN;
            } else {
                _index++;
                timerId = setTimeout(function () {
                    showGame(_index);
                }, difficulty.OFFTIME);
            }
        };

        var setOff = function () {
            pusherGreen = false;
            pusherRed = false;
            pusherYellow = false;
            pusherBlue = false;
            notify();
        };

        var showFail = function (_times) {
            if (_times === 0) {
                gameState = GAMESTATE.MACHINETURN;
                doMachineTurn();
            } else {
                pusherGreen = true;
                pusherRed = true;
                pusherYellow = true;
                pusherBlue = true;
                notify();
                timerId = setTimeout(function () {
                    terminateCurrentFailShow(_times);
                }, 1000);
            }
        };

        var terminateCurrentFailShow = function (_times) {
            setOff();
            _times--;
            timerId = setTimeout(function () {
                showFail(_times);
            }, 500);
        };

        var showWin = function (_times, _lastPusher) {

            var newLastPusher;

            if (_times === 0 && _lastPusher === PUSHER.YELLOW) {
                clearTimeout(timerId);
                gameState = GAMESTATE.MACHINETURN;
                currentGame = [Math.floor((Math.random() * 4) + 1)];
                revisionIndex = 0;
                setOff();
                timerId = setTimeout(function () {
                    doMachineTurn();
                }, 1500);
            } else {
                if (_lastPusher === PUSHER.BLUE) {
                    pusherYellow = true;
                    newLastPusher = PUSHER.YELLOW;
                } else if (_lastPusher === PUSHER.GREEN) {
                    pusherRed = true;
                    newLastPusher = PUSHER.RED;
                } else if (_lastPusher === PUSHER.RED) {
                    pusherBlue = true;
                    newLastPusher = PUSHER.BLUE;
                } else if (_lastPusher === PUSHER.YELLOW) {
                    pusherGreen = true;
                    newLastPusher = PUSHER.GREEN;
                }

                notify();
                timerId = setTimeout(function () {
                    terminateCurrentWinShow(_times, newLastPusher);
                }, 500);
            }
        };

        var terminateCurrentWinShow = function (_times, _lastPusher) {
            setOff();
            if (_lastPusher === PUSHER.YELLOW)
                _times--;
            timerId = setTimeout(function () {
                showWin(_times, _lastPusher);
            }, 100);
        };

        var timerId;
        var difficulty = DIFFICULTY.ONE;
        var gameState = GAMESTATE.STOPED;
        var strictMode = false;
        var currentGame = [Math.floor((Math.random() * 4) + 1)];
        var revisionIndex = 0;
        var pusherGreen = false;
        var pusherRed = false;
        var pusherYellow = false;
        var pusherBlue = false;
    }
};

var SimonBodyView = function (_gameModel) {

    if (SimonBodyView.prototype.INSTANCE) {
        return SimonBodyView.prototype.INSTANCE;
    } else {

        //singleton
        SimonBodyView.prototype.INSTANCE = this;

        //properties
        //implements observer interface
        this.refresh = function () {

            //button-start-led
            if (subject.getGamestate() !== GAMESTATE.STOPED)
                $("#button-start-led").css({"backgroundColor": "red"});
            else
                $("#button-start-led").css({"backgroundColor": "darkred"});

            //button-strict-led
            if (subject.getStrictMode())
                $("#button-strict-led").css({"backgroundColor": "red"});
            else
                $("#button-strict-led").css({"backgroundColor": "darkred"});

            //button-difficulty-button
            if (subject.getDifficulty() === DIFFICULTY.ONE)
                $("#button-difficulty-button").css({"left": "0px"});
            else if (subject.getDifficulty() === DIFFICULTY.TWO)
                $("#button-difficulty-button").css({"left": "5px"});
            else if (subject.getDifficulty() === DIFFICULTY.THREE)
                $("#button-difficulty-button").css({"left": "10px"});

            //pushers render
            if (subject.getPusherGreen()) {
                $("#tl").animate({backgroundColor: "rgb(1,254,166)"}, 240);
                $('#greenSound')[0].play();
            } else
                $("#tl").animate({backgroundColor: "rgb(1,126,83)"}, 240);
            if (subject.getPusherRed()) {
                $("#tr").animate({backgroundColor: "rgb(255,101,68)"}, 240);
                $('#redSound')[0].play();
            } else
                $("#tr").animate({backgroundColor: "rgb(174,31,0)"}, 240);
            if (subject.getPusherYellow() === true) {
                $("#bl").animate({backgroundColor: "rgb(255,230,87)"}, 240);
                $('#yellowSound')[0].play();
            } else
                $("#bl").animate({backgroundColor: "rgb(172,147,0)"}, 240);
            if (subject.getPusherBlue() === true) {
                $("#br").animate({backgroundColor: "rgb(0,175,242)"}, 240);
                $('#blueSound')[0].play();
            } else
                $("#br").animate({backgroundColor: "rgb(0,83,115)"}, 240);

            //game board
            if (subject.getGamestate() === GAMESTATE.HUMANTURN
                    || subject.getGamestate() === GAMESTATE.MACHINETURN)
                $("#gameBoard").html("Count: " + subject.getCount());
            else if (subject.getGamestate() === GAMESTATE.STOPED)
                $("#gameBoard").html("SIMON");
            else if (subject.getGamestate() === GAMESTATE.FAILSHOW)
                $("#gameBoard").html("FAIL")
                        .animate({opacity: 0}, 500)
                        .animate({opacity: 1}, 500);
            else if (subject.getGamestate() === GAMESTATE.WINSHOW)
                $("#gameBoard").html("YOU WIN")
                        .animate({opacity: 0}, 150)
                        .animate({opacity: 1}, 150);
        };

        var loadListeners = function () {

            $("#button-strict-button").click(function () {
                (new GameController()).pushStrict();
            });

            $("#button-difficulty-button").click(function () {
                (new GameController()).pushDifficulty();
            });

            $("#button-start-button").mousedown(function () {
                pulserFlag = true;
                timerId = setTimeout(function () {
                    checkPulserFlag();
                }, CONFIG.PULSERTIME);
            });

            $("#button-start-button").mouseup(function () {
                if (pulserFlag) {
                    pulserFlag = false;
                    (new GameController()).pushStart();
                }
            });

            $("#tl").click(function () {
                (new GameController()).pushPusher(PUSHER.GREEN);
            });

            $("#tr").click(function () {
                (new GameController()).pushPusher(PUSHER.RED);
            });

            $("#bl").click(function () {
                (new GameController()).pushPusher(PUSHER.YELLOW);
            });

            $("#br").click(function () {
                (new GameController()).pushPusher(PUSHER.BLUE);
            });
        };

        var checkPulserFlag = function () {
            if (subject.getGamestate() !== GAMESTATE.STOPED
                    && pulserFlag) {
                pulserFlag = false;
                (new GameController()).holdStart();
            }
        };

        var subject = _gameModel;
        var timerId;
        var pulserFlag = false;

        loadListeners();
    }
};

var GameController = function () {

    if (GameController.prototype.INSTANCE) {
        return GameController.prototype.INSTANCE;
    } else {

        //singleton
        GameController.prototype.INSTANCE = this;

        //properties
        this.pushDifficulty = function () {
            gameModel.pushDifficulty();
        };

        this.pushStrict = function () {
            gameModel.pushStrict();
        };

        this.pushStart = function () {
            gameModel.pushStart();
        };

        this.pushPusher = function (_pusher) {
            gameModel.pushPusher(_pusher);
        };

        this.holdStart = function (_pusher) {
            gameModel.holdStart();
        };

        var gameModel = new GameModel();
        var simonBodyView = new SimonBodyView(gameModel);

        gameModel.addSuscriber(simonBodyView);
    }
};

var Main = function () {
};

Main.main = function () {
    new GameController();
};

Main.main();