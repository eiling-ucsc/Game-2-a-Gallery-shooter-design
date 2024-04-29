class Shooter extends Phaser.Scene {
    constructor() {
        super("shooter");

        this.my = {sprite: {
            lasers: [],
            enemies: [],
            enemylasers: []
        }};

        this.bodyX = 300;
        this.bodyY = 570;
        this.playerSpeed = 15;
        this.emitSpeed = 30; 
        this.isEmitterActive = false; 
        this.enemyLaserEmit = false;
        this.runModeActive = false;
        this.emitCooldown = 0;
        this.lives = 100;
        this.score = 0;
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.atlasXML("gameParts", "sheet.png", "sheet.xml");
    }

    create() {
        let my = this.my;

        // Player

        my.sprite.player = this.add.sprite(this.bodyX, this.bodyY, "gameParts", "enemyGreen1.png");
        my.sprite.player.setScale(0.5);
        my.sprite.player.angle = 180;

        // Enemy Sprites

        this.createWave();
        this.createEnemySprite2(760, 35);

        // Timer

        this.time.addEvent({
            delay: 1500, 
            loop: true, 
            callback: () => {
                this.runModeActive = !this.runModeActive; 
                this.enemyLaserEmit = true;
            }
        });

        // Keys

        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    update() {
        let my = this.my;

        // Game information

        document.getElementById('lives').innerHTML = '<h2>Ship Integrity: ' + this.lives + '%</h2>'
        document.getElementById('score').innerHTML = '<h2>Score: ' + this.score + '</h2>'
        
        // Controls

        if (this.keyA.isDown) {
            my.sprite.player.x -= this.playerSpeed;
        }
        else if (this.keyD.isDown) {
            my.sprite.player.x += this.playerSpeed;
        }

        this.checkBounds(my.sprite.player);

        // Shooting

        if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
            this.emitSprite(my.sprite.player.x, my.sprite.player.y);
        }

        if (this.isEmitterActive) {
            my.sprite.lasers.forEach(laser => {
                laser.y -= this.emitSpeed;
                if (laser.y < 0) {
                    laser.destroy();
                    my.sprite.lasers.splice(my.sprite.lasers.indexOf(laser), 1);


                } else {
                    // Laser collision with enemies
                    for (let i = 0; i < my.sprite.enemies.length; i++) {
                        let enemy = my.sprite.enemies[i];
                        if (this.checkOverlap(laser, enemy)) {
                            console.log('Collision detected with enemy:', enemy);
                            if (enemy.type == 1){
                                this.score += 100;
                                this.score += Math.floor(Math.random() * 50);

                            } else if (enemy.type == 2){
                                this.score += 500;
                                this.score += Math.floor(Math.random() * 250);
                            }
                            laser.destroy();
                            enemy.destroy();
                            my.sprite.enemies.splice(i, 1); 
                            console.log('Enemy destroyed and removed from the list');
                            break; 
                        }
                    }
                }
            });
        }

        // Enemy 1 drone movement

        my.sprite.enemies.forEach(enemy => {
            enemy.points[0] = {x: my.sprite.player.x, y: 600 };
        });

        if (this.runModeActive) {
            let playerPosition = { x: this.curve.points[0].x, y: this.curve.points[0].y };
    
            my.sprite.enemies.forEach(enemy => {
                if (enemy.type == 1){
                    let randomNumber = Math.floor(Math.random() * 120) + 1;
                    if (randomNumber == 5){
                        // Move the enemy ship to the player position
                        this.tweens.add({
                            targets: enemy,
                            x: enemy.points[0].x,
                            y: enemy.points[0].y,
                            duration: 1500,
                            onComplete: () => {
                                // After reaching the player position, return to the original position
                                this.tweens.add({
                                    targets: enemy,
                                    x: enemy.originalPosition.x,
                                    y: enemy.originalPosition.y,
                                    duration: 1500
                                });
                            }
                        });
                    }
                }
            });
        }

        // Enemy 2 laser shooting

        if (this.enemyLaserEmit) {
            my.sprite.enemies.forEach(enemy => {
                if (enemy.type == 2){
                    this.emitLasersForEnemy2(enemy);
                    this.enemyLaserEmit = false;
                }
            });
        }


        // Enemy laser collision
        my.sprite.enemylasers.forEach(laser => {
            laser.y += this.emitSpeed; 
            if (this.checkOverlap(laser, my.sprite.player)) {
                this.lives -= 1;
            }
        });

        // Enemy drone collision
        my.sprite.enemies.forEach(enemy => {
            if (this.checkOverlap(enemy, my.sprite.player)) {
                this.lives -= 1;
            }
        });

        console.log(this.my.sprite.enemies.length);

        // Stage cleared
        if (this.my.sprite.enemies.length == 0 && this.lives > 0){
            this.displayStageCleared();
            this.input.keyboard.once('keydown-Z', () => {
                this.scene.restart();
            });
        }

        // Game Over
        if (this.lives <= 0){
            this.input.keyboard.once('keydown-Z', () => {
                this.score = 0;
                this.lives = 100;
                this.scene.restart();
            });
            this.displayGameOver();
        }
        
    }



    // FUNCTIONS


    checkBounds(sprite) {
        if (sprite.x < 0) {
            sprite.x = 0;
        } else if (sprite.x > this.sys.game.config.width) {
            sprite.x = this.sys.game.config.width;
        }
    }

    checkOverlap(spriteA, spriteB) {
        let boundsA = spriteA.getBounds();
        let boundsB = spriteB.getBounds();
    
        return Phaser.Geom.Intersects.RectangleToRectangle(boundsA, boundsB);
    }

    emitSprite(x, y) {
        let my = this.my;
    
        let laser = this.add.sprite(x, y, "gameParts", "laserGreen08.png");
        my.sprite.lasers.push(laser);
        this.isEmitterActive = true;
    }

    emitLasersForEnemy2(enemy) {
        let my = this.my;
        // Emit lasers for enemy 2
        let laserX = enemy.x;
        let laserY = enemy.y;
        let laser = this.add.sprite(laserX, laserY, "gameParts", "laserRed04.png");
        my.sprite.enemylasers.push(laser);
    }
    
    createEnemySprite1(x, y){
        let my = this.my;

        let enemy = this.add.sprite(x,y, "gameParts", "playerShip1_red.png");
        enemy.type = 1;
        enemy.setScale(0.6);
        enemy.originalPosition = {x: x, y: y};
        enemy.points = [
            200, 200
        ];
        this.curve = new Phaser.Curves.Spline(enemy.points);
        my.sprite.enemies.push(enemy);
    }

    createEnemySprite2(x, y){
        let my = this.my;

        let enemy = this.add.sprite(x,y, "gameParts", "playerShip2_red.png");
        enemy.type = 2;
        enemy.setScale(0.6);
        enemy.originalPosition = {x: x, y: y};
        enemy.points = [
            { x: 50, y: 35 }, // top left
            { x: 760, y: 35 } // top right
        ];
        this.curve = new Phaser.Curves.Spline(enemy.points);
        my.sprite.enemies.push(enemy);
    }

    createWave(){
        let my = this.my;

        for (let i = 0; i < 6; i++) {
            this.createEnemySprite2(50 + i*142, 35);
        }

        for (let i = 0; i < 12; i++) {
            for (let j = 0; j < 3; j++) {
                this.createEnemySprite1(50 + i*65, 145 + j*55);
            }
        }
    }

    reset(){
        this.children.removeAll();
        this.my.sprite.lasers = [];
        this.my.sprite.enemies = [];
        this.my.sprite.enemylasers = [];
        this.isEmitterActive = false; 
        this.enemyLaserEmit = false;
        this.runModeActive = false;
    }

    displayStageCleared(){
        this.reset();

        this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 50,
            "Stage Cleared!",
            {
                fontFamily: 'Arial',
                fontSize: 48,
                color: '#00ff00', // Green color
                align: 'center'
            }
        ).setOrigin(0.5);
    
        this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 50,
            "Press Z to continue",
            {
                fontFamily: 'Arial',
                fontSize: 24,
                color: '#ffffff', // White color
                align: 'center'
            }
        ).setOrigin(0.5);
    }

    displayGameOver() {
        this.reset();
        this.lives = 0;
    
        let gameOverText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 50,
            "Game Over",
            {
                fontFamily: 'Arial',
                fontSize: 48,
                color: '#ff0000',
                align: 'center'
            }
        ).setOrigin(0.5);
    
        let instructionText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 50,
            "Press Z to play again",
            {
                fontFamily: 'Arial',
                fontSize: 24,
                color: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5);
        
        this.input.keyboard.once('keydown-Z', () => {
            this.scene.restart();
        });
    }    
}