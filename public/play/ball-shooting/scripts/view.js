var game = this.game || (this.game = {});
var createjs = createjs || {};

; (function (game, cjs) {
  game.view = game.view || {};

  game.view.showScoreBoard = function () {
    this.scoreBoard = new lib.ScoreBoard();
    this.scoreBoard.x = 10;
    this.scoreBoard.y = 10;
    game.stage.addChild(this.scoreBoard);
  };
  game.view.updateScore = function () {
    this.scoreBoard.textField.text = game.score + '';
  };

  game.view.addSpriteToBody = function (body, spriteName, index) {
    var sprite = new lib[spriteName]();
    sprite.x = -99;
    if (index !== undefined) {
      game.stage.addChildAt(sprite, index);
    } else {
      game.stage.addChild(sprite);
    }
    body.SetUserData(sprite);
  };

  game.view.initPowerIndicator = function () {
    this.power = new lib.PowerArrow();
    game.stage.addChild(this.power);

    // 👇 نص توضيحي
    this.powerText = new createjs.Text(
      "اضغط مطول علشان تزود القوة 🔥",
      "16px Arial",
      "#ffffff"
    );

    this.powerText.textAlign = "center";
    this.powerText.x = 240; // في النص
    this.powerText.y = 20;

    game.stage.addChild(this.powerText);

    this.power.visible = false;
    this.powerText.visible = false;
  };

  game.view.showPowerIndicator = function (x, y) {
    this.power.visible = true;
    this.power.x = x;
    this.power.y = y;

    this.powerText.visible = true; // 👈 يظهر النص
  };
  game.view.hidePowerIndicator = function () {
    this.power.visible = false;
    this.powerText.visible = false; // 👈 يخفي النص
  };
  game.view.rotatePowerIndicator = function (rotation) {
    this.power.rotation = rotation;
  };
  game.view.updatePowerBar = function (value) {
    this.power.powerBar.scaleY = Math.min(30, value);

    if (value < 10) {
      this.powerText.text = "خفيف 😅";
    } else if (value < 20) {
      this.powerText.text = "تمام 👌";
    } else {
      this.powerText.text = "اضرب يا وحش 🔥🔥";
    }
  };


}).call(this, game, createjs);