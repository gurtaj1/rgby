$(document).ready(function(){
    //============================================================================STATE VARIABLE============================================================================
    var powerOn = false;
    var strictOn = false;
    var startOn = false;
    //============================================================================GAME VARIABLES============================================================================
    var levelCount;
    var currentPattern;
    var pressCount;
    var pressPattern;
    //============================================================================SETUP AUDIO============================================================================
    var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    //create web audio api context (variable name is just short for audio context)

    var frequencies = [329.63,261.63,220,164.81]; //frequency value in hertz

    var oscillators = frequencies.map(function(frequency){
    var oscillator = audioCtx.createOscillator();  //create Oscillator node(s)
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.start(0.0);  //delay is an optional parameter but mandatory in safari
    return oscillator;
    })
    //creates all the frequencies that will be 'playing' from the moment the page is loaded

    var gainNodes = oscillators.map(function(oscillator){
    var gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);//once done something with the sound in one node (node refers to a, part of the pipeline), pass it onto the next node, in this case the destination which is, by default, the computer speaker.
    gainNode.gain.value = 0;
    return gainNode;
    })
    //creates gainNode for each frequency that is playing and sets their 'volume' to 0 (so they will not be heard yet)

    var errorOscillator = audioCtx.createOscillator();
    errorOscillator.type = "triangle";
    errorOscillator.frequency.value = 110;
    errorOscillator.start(0.0);
    var errorGainNode = audioCtx.createGain();
    errorOscillator.connect(errorGainNode);
    errorGainNode.gain.value = 0;
    errorGainNode.connect(audioCtx.destination);
    //create error oscillator and gain node.
    //============================================================================COLOR BUTTON PROPERTIES============================================================================
    var colorsObj = {
    "0": {
        activate: function() {
        $("#0").css("background-color", "#FF2828");
        gainNodes[0].gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.01);//ramps volume of gainNode up to 0.5 over a period of currentTime + 0.01
        },
        deactivate: function() {
        $("#0").css("background-color", "#D00000");
        gainNodes[0].gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.01);//ramps volume back down to 0
        },
        timeOut: function() {
        setTimeout(function(){
            $("#0").css("background-color", "#D00000");
            gainNodes[0].gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.01);
        },400)
        } 
    },
    "1": {
        activate: function() {
        $("#1").css("background-color", "#57AE49");
        gainNodes[1].gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.01);
        },
        deactivate: function() {
        $("#1").css("background-color", "#128900");
        gainNodes[1].gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.01);
        },
        timeOut: function() {
        setTimeout(function(){
            $("#1").css("background-color", "#128900");
            gainNodes[1].gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.01);
        },400)
        }
    },
    "2": {
        activate: function() {
        $("#2").css("background-color", "#4841FF");
        gainNodes[2].gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.01);
        },
        deactivate: function() {
        $("#2").css("background-color", "#0006A6");
        gainNodes[2].gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.01);
        },
        timeOut: function() {
        setTimeout(function(){
            $("#2").css("background-color", "#0006A6");
            gainNodes[2].gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.01);
        },400)
        }
    },
    "3": {
        activate: function() {
        $("#3").css("background-color", "#E4D04E");
        gainNodes[3].gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.01);
        },
        deactivate: function() {
        $("#3").css("background-color", "#9B8600");
        gainNodes[3].gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.01);
        },
        timeOut: function() {
        setTimeout(function(){
            $("#3").css("background-color", "#9B8600");
            gainNodes[3].gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.01);
        },400)
        }
    }
    };
    
    function muteAllColors() {
    for(var i=0; i<4 ; i++) {
        colorsObj[i].deactivate();
    } //stops all color changes and sounds that may be playing 
    }
    //============================================================================MOUSE CLICK FUNCTIONS============================================================================
    function allowInput(timeOut) {
        $(".colorButton").mousedown(function(event){
            clearTimeout(timeOut);
            colorsObj[event.target.id].activate(); //makes sound of relevant color
            pressPattern.push(event.target.id);
            pressCheck(event.target.id);
            pressCount++;
        }).mouseup(function(event){
            colorsObj[event.target.id].deactivate(); //stops sound of relevant color
        }).mouseleave(function(event){
            colorsObj[event.target.id].deactivate();
        })

        $(".colorButton").on("touchstart", function(event){
            clearTimeout(timeOut);
            colorsObj[event.target.id].activate(); //makes sound of relevant color
            pressPattern.push(event.target.id);
            pressCheck(event.target.id);
            pressCount++;
        }).on("touchend", function(event){
            colorsObj[event.target.id].deactivate();
        })
    }
    //all colorButtons share the class name but have unique id which can be retrieved from event.target.id whenever any particular one is clicked, this is how the appropriate active and non active states can be assigned correctly by the above mousedown/mouseup function.
    
    function blockInput() {
    $(".colorButton").off("mousedown");
    setTimeout(function(){
        $(".colorButton").off("mouseup");
        $(".colorButton").off("mouseleave");
        muteAllColors(); //because without this the color will stay illuminated if the user keeps mousedown after the mouseup/mouseleave handlers are removed
    }, 1000);
    }
    //have set a timemout on the mouseup/mouseleave event handler removals; since the mousedown eventhandler triggers the presscheck, which can in turn trigger the next level and callthis blockInput function, without the timeout the clicked button would remain in on on state with no eventhandler to switch it off. this timeout allows for a second to release the mouse click before this happens. it also means that the color WILL illuminate and sound even though the next level has been triggered, with out the delay there would be no visual/audio feedback for the user on the last button press
    
    function pressCheck(button) {
    if (button != currentPattern[pressCount]) {    //incorrect button pressed
        blockInput();
        errorControl();
    } else if (pressCount == levelCount - 1 && levelCount == 20){ //Game Won!
        blockInput();
        flashMessage(":-)", 5)
        setTimeout(function(){initialize();}, 5000);
    } else if (pressCount == levelCount - 1) {    //level complete
        blockInput();
        setTimeout(function(){newLevel();}, 1000);
    } else { //correct press but level not yet complete - so move on to the next press
        var timesUp = setTimeout(function(){pressCheck("error")}, 5000);
        $(".colorButton").off();  //this is done so that there are not multiples of the same event handlers on the buttons due to the call of allowInput that is needed below in order to pass the above timesUp into it (so that another countdown is set which will trigger if no button is pressed in the set amount of time)
        allowInput(timesUp);
    }
    }
    //============================================================================SET ACTIVE/NON-ACTIVE STATES============================================================================
    function initialize() {
    powerOn = true;
    strictOn = false;
    startOn = false;
    currentPattern = [];
    $("#slider").css("transform", "translate(20px,0px)");
    $(".countDisplay").css("color", "#AE0000");
    $(".countDisplay").html("--");
    }

    function terminate() {
    powerOn = false;
    strictOn = false;
    startOn = false;
    levelCount = 0;
    blockInput();
    $(".strictLight").css("background-color", "#5B0000");
    $(".countDisplay").css("color", "#5B0000");
    $(".countDisplay").html("--");
    $("#slider").css("transform", "");
    errorGainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.01); //stops error sound if it is playing
    muteAllColors();//stops all sounds and light-up colors
    }
    //these will be used for power on and power off as well as resets
    //============================================================================TOGGLE SWITCHES============================================================================
    $(".switch").click(function(){
    if (powerOn === false){
        initialize();
    } else {
        terminate();
    }    
    })

    $(".strictButton").click(function(){
    if (powerOn === true && strictOn === false) {
        $(".strictLight").css("background-color", "red");
        strictOn = true;
    } else if (powerOn === true && strictOn === true) {
        $(".strictLight").css("background-color", "#390000");
        strictOn = false;
    }
    })

    $(".startButton").click(function(){
    if (startOn === false && powerOn === true){
        levelCount = 0;
        startOn = true;
        flashMessage("--", 2)
        /*currentPattern = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; 
        levelCount = 19;*/                                                           //for TESTING win message call
        setTimeout(function(){newLevel();}, 2000);
    } else if (startOn === true && powerOn === true) {
        blockInput();
        levelCount = 0;
        currentPattern = [];
        flashMessage("--", 2)
        setTimeout(function(){newLevel();}, 2000);
    }
    })
    //============================================================================GAME FUNCTIONS===========================================================================
    function newLevel() {
    pressCount = 0;
    pressPattern = [];
    levelCount++;
    currentPattern.push(Math.floor(Math.random() * 4));
    $(".countDisplay").html((levelCount < 10) ? "0" + levelCount : levelCount);
    patternLoop();
    }  

    function patternLoop() {
    var timeStep;
    if (levelCount < 4) {
        timeStep = 1250;
    } else if (levelCount < 8) {
        timeStep = 1000;
    } else if (levelCount < 12) {
        timeStep = 750;
    } else {
        timeStep = 500;
    }
    var inputCallCorrection = 0; // used this var to stop a allowInput call from a previous patternLoop, being executed after a, power off then power on then start, was applied
    for (let i=0; i<currentPattern.length; i++){//had to use 'let i' instead of 'var i' here because of setTimeout within the loop (NEED TO UNDERSTAND WHY)
        setTimeout(function(){
        if (powerOn === true){ //this if statement is in this timeout because the power may have been switched after the timeout was called but before its delayed execution
            colorsObj[currentPattern[i]].activate();
            colorsObj[currentPattern[i]].timeOut();
        }
        }, (i+1)*timeStep);
        inputCallCorrection++;
    }
    setTimeout(function() {
        if (inputCallCorrection == levelCount) {  //had other checks in this statement but not needed now since levelCount will always be 0 for power off (and start trigger)
        var timesUp = setTimeout(function(){
            if (powerOn === true) { //power may have been switched off before function is executed(may be reason for no button press)
            pressCheck("error")
            }
        }, 5000);                //this calls an error if not cleared by a button press (it is passed into the allowInput function)
        allowInput(timesUp);
        }
    }, (currentPattern.length + 0.5)*timeStep);
    }
    //the first setTimout will make sure that all relevant colors are not activated at once. instead they are activated in series by calling them at a time that is calculated using their index value. the second setTimeout will call the allowInput function once the full pattern has been played to the user.
    
    function errorControl() {
    blockInput();
    setTimeout(function(){errorGainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.01);}, 500);//sound error tone
    setTimeout(function(){errorGainNode.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + 0.01);}, 1500);//stop error tone
    flashMessage("!!!!", 2);
    setTimeout(function(){
        if (powerOn === false){ //since this is a timeout the power may have been switched off before the function executes so need this statement in here too
        terminate();
        } else if (strictOn === true){
        levelCount = 0;
        currentPattern = [];
        newLevel();
        } else if (levelCount != 0){ //because power off and then power on may have been quickly triggered by user since the error sound and before the execution of this timeout
        $(".countDisplay").html((levelCount < 10) ? "0" + levelCount : levelCount);
        pressCount = 0;
        pressPattern = [];
        patternLoop();
        } 
    }, 2000)//NB the start on function starts newLevel with a 2second delay as well so a power restart and then start will never occure before this function is executed
    }

    function flashMessage(message, times) {
    var flashCount = 0;
    var offToOn = function() {
        if (powerOn === true) {
        $(".countDisplay").css("color", "#5B0000");//light off
        $(".countDisplay").html(message);//show message
        setTimeout(function(){
            $(".countDisplay").css("color", "#AE0000");
        }, 200); //light on after 200ms
        }
    }
    var flash = setInterval(function(){
        offToOn();
        flashCount++;
        if (flashCount == times){
        clearInterval(flash);
        }
    }, 400);//repeat the light OffToOn function every 400ms until the count has reached that set by the times argument passed into this function 
    }
})