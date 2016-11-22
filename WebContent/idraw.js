idraw = {}
// まず実行、mockの場合はこれを実行せず、socketのmockを作成する
idraw.websocketInit = function() {
    var host="ws://localhost:8080/idraw/endpoint";
    socket = new WebSocket(host);
}
// 次にこちらを実行
idraw.loadSessionId = function() {
    // Cookieが使えるかの処理
    if (window.navigator.cookieEnabled) {
    	sessionId = $.cookie("JSESSIONID");
    } else {
    	alert("ブラウザでCookieを有効化してください");
    }
}
// 次にこちらを実行
idraw.eventDefine = function() {
    var offset = 0;
    var fromX;
    var fromY;
    var drawFlag = false;
    var drawFlip = false;
    var context = $("canvas").get(0).getContext('2d');

    // Websocket受信時の処理
    socket.onmessage = function(msg){
        var json = $.parseJSON(msg.data);
    	console.log(json);
    	switch (json.cmd){
    	case "pen":
            context.strokeStyle = json.color;
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(json.fx, json.fy);
            context.lineTo(json.tx, json.ty);
            context.stroke();
            context.closePath();
    		break;
    	case "save":
    		break;
    	}
    }

    // キー入力時の処理
    document.onkeydown = function (e){
    	switch (e.key){
    	case "ArrowUp":
    	case "w":
    		$("#panel_console").animate({top: '500px'},500);
    		// 上に移動
    		//setPositionById("canvas");
    		break;
    	case "ArrowDown":
    	case "s":
    		$("#panel_console").animate({top: '600px'},500);
    		// 下に移動
    		//setPositionById("console");
    		break;
    	case "ArrowLeft":
    	case "a":
    		if (!(pagerJson === undefined || currentPage === undefined || pagerJson[currentPage+1] === undefined)){
    			pagerJson[currentPage]["image"] = $("#canvas")[0].toDataURL("image/png");
    			var image = new Image();
    			image.src = pagerJson[currentPage+1]["image"];
    			currentPage += 1;
    			image.onload = function(){
    			  // 画像の読み込みが終わったら、Canvasに画像を反映する。
    				var ctx = $("#canvas")[0].getContext("2d");
    				ctx.clearRect(0, 0, 800, 600);
    				ctx.drawImage(image, 0, 0);
    				console.log(currentPage);
    			}
    		}
    		break;
		case "ArrowRight":
		case "d":
    		if (!(pagerJson === undefined || currentPage === undefined || pagerJson[currentPage-1] === undefined)){
    			pagerJson[currentPage]["image"] = $("#canvas")[0].toDataURL("image/png");
    			var image = new Image();
    			image.src = pagerJson[currentPage-1]["image"];
    			currentPage -= 1;
    			image.onload = function(){
    				// 画像の読み込みが終わったら、Canvasに画像を反映する。
    				var ctx = $("#canvas")[0].getContext("2d");
    				ctx.clearRect(0, 0, 800, 600);
    				ctx.drawImage(image, 0, 0);
    				console.log(currentPage);
    			}
    		}
			break;
		}
    };

    $('canvas').mousedown(function(e) {
        drawFlag = true;
        fromX = e.pageX - $(this).offset().left - offset;
        fromY = e.pageY - $(this).offset().top - offset;
        return false;  // for chrome
    });

    $('canvas').mousemove(function(e) {
        if (drawFlag) {
        	if (drawFlip) {
                draw(e);
        	}
        	drawFlip = !drawFlip;
        }
    });

    $('canvas').on('mouseup', function() {
        drawFlag = false;
    });

    $('canvas').on('mouseleave', function() {
        drawFlag = false;
    });

    $('.palette_cell').click(function() {
        context.strokeStyle = $(this).css('background-color');
    });

    $('#tool_clear').click(function(e) {
        e.preventDefault();
        context.clearRect(0, 0, $('canvas').width(), $('canvas').height());
    });

    $('#tool_save').click(function() {
        socket.send(JSON.stringify({ cmd:"save", page_num:1, image: canvasToMinimizeBase64($("#canvas")[0])}));
    });

    function draw(e) {
        var toX = e.pageX - $('canvas').offset().left - offset;
        var toY = e.pageY - $('canvas').offset().top - offset;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(fromX, fromY);
        context.lineTo(toX, toY);
        context.stroke();
        context.closePath();

        // サーバへメッセージ送信
        socket.send(JSON.stringify({ cmd:"pen", page: 1, fx:fromX, fy:fromY, tx:toX, ty:toY, color:context.strokeStyle }));
        fromX = toX;
        fromY = toY;
    }

    canvasToMinimizeBase64 = function(canvas) {
        var ctx = canvas.getContext('2d');
        // 小さいキャンバスを作成
        // 800x600の解像度だとJavascriptのWebsocketで送れるデータ量上限に引っかかって送れない
		// 苦肉の策として同じ4:3の576x432にした
        var canvas2 = document.createElement('canvas');
        canvas2.width = 576;
        canvas2.height = 432;
        var ctx2 = canvas2.getContext('2d');
        // 元のキャンバスを縮小コピー
        ctx2.drawImage(canvas, 0, 0, canvas2.width, canvas2.height);
        return canvas2.toDataURL("image/png");
    }

    pasteBase64 = function(canvas, x, y, base64Image) {
    	var img = new Image();
    	img.onload = function() {
    	  //Imageをキャンバスに描画
    	  var context = canvas.getContext("2d");
    	  context.drawImage(img, x, y);
    	};
    	img.src = base64Image;
    }
}