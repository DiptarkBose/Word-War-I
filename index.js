"use strict";

var Alexa = require('alexa-sdk');
var unirest = require('unirest');
var request = require('request');

var badges = ["Noob", "Master", "Grandmaster", "Legendary Grandmaster"];


function questionQuery(_this, stringMessage) {

  var url="https://twinword-word-association-quiz.p.mashape.com/type1/?area=gre&level=" + _this.attributes.stats['apiLevel'];

  request({
    headers: {
      "X-Mashape-Key": "YQfmpcMYUemshkP7Hbtdd4VRWAXmp10LJ99jsnDAxk3RFYbhYZ",
      "Accept": "application/json"
    },
    url: url,
    json: true
    }, function (error, response, body) {

    //Extracting questions and answers, storing them in an array
    var qArr=[];
    var aArr=[];
    for(var i=0; i<10; i++)
    {
      var responseString = "The three words are \n";
      responseString += body['quizlist'][i]['quiz'][0]+", \n"+body['quizlist'][i]['quiz'][1]+", and \n"+body['quizlist'][i]['quiz'][2]+".\n"
      responseString += " The first option is " + body['quizlist'][i]['option'][0] + " and the second option is " + body['quizlist'][i]['option'][1] + ". Which of the two options is the closest to the three words?";
      qArr.push(responseString);
      aArr.push(body['quizlist'][i]['correct']);
    }

    _this.attributes.quiz['questionArray']=qArr.slice(0);
    _this.attributes.quiz['answerArray']=aArr.slice(0);

    _this.response.speak(stringMessage + qArr[0]).listen("Just answer with the option number!");
    _this.emit(':responseReady'); 

  });
}

var handlers={

  'LaunchRequest' : function(){

    //New User
    if(Object.keys(this.attributes).length===0)
    {
      this.response.speak("<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_intro_01'/> Hi there! Welcome to Word War One, the fun way to master words for competitive exams such as GRE, GMAT and SAT. The game goes as follows. You will be given three words, and two options. You have to choose the option that is the closest to the three words. Just answer with the option number. Do you want to start the quiz?").listen("Ask for help if you need some. What do you want to do?");
      this.attributes.stats = {
        'totalQuestionsAnswered' : 0,
        'badgeLevel' : 0,
        'apiLevel' : 7
      };

    }
    //Returning User
    else
    {
      this.response.speak("Welcome back! You are currently at the " + badges[this.attributes.stats['badgeLevel']] + " badge. Ready to continue?").listen();
    }

    this.attributes.quiz = {
      'questionArray' : [],
      'answerArray' : []   
    };

    this.attributes['qCount'] = 0;
    this.emit(':responseReady');
  },

  'AskQuestionIntent': function(){

    //Asking question at the beginning of a session
    questionQuery(this, "");

    var qNo = this.attributes['qCount'];
    var responseString = this.attributes.quiz['questionArray'][qNo];
    this.attributes['qCount']++;
  },

  'AnswerQuestionIntent': function(){

    var responseString="";
    var chosenOption = parseInt(this.event.request.intent.slots.AnswerOption.value, 10);
    var qNo = this.attributes['qCount'];
    var flag=0;
    
    //Checking User Answer
    if(chosenOption == this.attributes.quiz['answerArray'][qNo-1])
    {
      responseString="<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_positive_response_02'/>"+ " Yep, that is the correct Answer! Moving on to the next question. ";

      this.attributes.stats['totalQuestionsAnswered']++;

      //Checking Badge Increment
      if(this.attributes.stats['totalQuestionsAnswered']==50)
      {
        responseString += "<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_positive_response_03'/> Congratulations! You have earned the Master badge! Play on to acquire more badges! ";
        this.attributes.stats['badgeLevel']++;
        this.attributes.stats['apiLevel']++;
        flag=1;
      }
      else if(this.attributes.stats['totalQuestionsAnswered']==75)
      {
        responseString += "<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_positive_response_03'/> Guess who just earned the Grandmaster badge! Keep it up, and keep on playing for more badges! ";
        this.attributes.stats['badgeLevel']++;
        this.attributes.stats['apiLevel']++;
        flag=1;
      }
      else if(this.attributes.stats['totalQuestionsAnswered']==100)
      {
        responseString += "<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_positive_response_03'/> Congratulations on completing the game! All hail the Legendary Grandmaster! You can still continue playing! ";
        this.attributes.stats['badgeLevel']++;
        this.attributes.stats['apiLevel']++;
        flag=1;
      }
    }
    else
      responseString ="<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_negative_response_02'/> Bummer! Wrong Answer! The correct answer is option number " + this.attributes.quiz['answerArray'][qNo-1]+ ". Moving on to the next question. ";
    

    //Crafting the next set of question if quiz content exhausted or badge increment
    if(qNo>=10 || flag==1)
    {
      questionQuery(this, responseString); 
      this.attributes['qCount']=0;
      flag=0;
    }

    else
    {
      var qNo = this.attributes['qCount'];
      responseString += this.attributes.quiz['questionArray'][qNo];
      this.attributes['qCount']++;

      this.response.speak(responseString).listen("Just answer with the option number!");
      this.emit(':responseReady');
    }
    
  },

  'SessionEndedRequest': function(){
    this.emit(':saveState', true);
  },

  'StatsIntent' : function(){
    var qa= this.attributes.stats['totalQuestionsAnswered'];
    var reqd_next = 0;
    var responseString;
    if(qa<100)
    {
      if(qa < 50)
        reqd_next = 50 - qa;
      else if(qa < 75)
        reqd_next = 75 - qa;
      else if(qa < 100)
        reqd_next = 100 - qa;
      
      responseString = "You have answered " + qa +" questions and are currently at the " + badges[this.attributes.stats['badgeLevel']] + " badge level! You need to answer " + reqd_next + " more questions to reach the next badge." ;
    }
    else
      responseString = "You have answered " + qa +" questions and are currently at the " + badges[this.attributes.stats['badgeLevel']] + " badge level! You have reached the highest badge possible!" ;
    responseString += " Do you want to start the quiz?";
    this.response.speak(responseString).listen("Do you want to start the quiz?");
    this.emit(':responseReady');
  },

  'AMAZON.FallbackIntent' : function()
  {
    this.response.speak("Sorry, I didn't get that!").listen("Do you want to start the quiz?");
    this.emit(':responseReady');
  },

  'AMAZON.StopIntent' : function()
  {
    this.response.speak("Lets play soon! <audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_outro_01'/>");
    this.emit(':responseReady');
  },

  'AMAZON.CancelIntent' : function()
  {
    this.response.speak("Lets play soon! <audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_outro_01'/>");
    this.emit(':responseReady');
  },

  'AMAZON.HelpIntent' : function()
  {
    this.response.speak("Word war one is intended to help you in mastering words for GRE, GMAT and SAT in a fun and interactive way. You will be given three words, and two options. You have to choose the option that is the closest to the three words. Just answer with the option number. Answer questions to receive badges, and compete with your friends to win the title of Legendary Grandmaster! You can also know about your performance by asking me for stats. Do you want to start the quiz now?").listen("Do you want to start the quiz?");
    this.emit(':responseReady');
  },

  'Unhandled' : function(){
    this.response.speak("Pardon me for this technical snag! Please try after some time! <audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_outro_01'/>");
    this.emit(':responseReady');
  },

  'RepeatIntent' : function(){
    var qNo = this.attributes['qCount'];
    var responseString = "Listen closely. "+ this.attributes.quiz['questionArray'][qNo-1];
    this.response.speak(responseString).listen("Just answer with the option number!");
    this.emit(':responseReady');
  }
}

exports.handler = function(event, context, callback){
  var alexa = Alexa.handler(event, context);
  alexa.appId = "amzn1.ask.skill.6fc61557-fc3c-4a2d-97fa-611f1b472987";
  alexa.registerHandlers(handlers);
  alexa.dynamoDBTableName = 'Stats';
  alexa.execute();
};