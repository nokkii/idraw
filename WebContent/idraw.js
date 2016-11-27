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
    var GCO=context.globalCompositeOperation;
    var penStyle="#000000";
    var isEraser=false;
    imageBuffer = {}
    currentPage = "-1";

    // Websocket受信時の処理
    commands = [
    	function(json){
	    	switch (json.cmd){
	    	case "pen":
	    		if (currentPage == json.page) {
		            context.strokeStyle = json.color;
		            context.lineWidth = 2;
		            context.beginPath();
		            context.moveTo(json.fx, json.fy);
		            context.lineTo(json.tx, json.ty);
		            context.stroke();
		            context.closePath();
	    		}
	    		break;
	    	case "chat":
	    		$("#chat_window").html($("#chat_window").html()+"<br>"+json.text);
	    		break;
	    	case "chatdel":
	    		var select = confirm("チャット内容を全て削除します。よろしいですか？");
	    		if(select == true){
	    			$("#chat_window").empty();
	        		alert("削除しました");
	    		}else{
	    			alert("キャンセルしました");
	    		}
	    		break;
	    	case "pubkey":
	    		pubkey = json.key;
	    		break;
	    	}
	    }
    ];
    socket.onmessage = function(msg){
        var json = $.parseJSON(msg.data);
    	console.log(json);
    	for(var i=0; i<commands.length; i++){
    		commands[i](json);
    	}
    }

    // キー入力時の処理
    keyHookers = [
    	function (e){
	    	switch (e.key){
	    	case "ArrowUp":
	    	case "w":
	    		$("#panel_console").animate({top: '500px'},500);
	    		break;
	    	case "ArrowDown":
	    	case "s":
	    		$("#panel_console").animate({top: '600px'},500);
	    		break;
			}
	    }
    ];
    window.onkeydown = function(e){
    	for(var i=0; i<keyHookers.length; i++){
    		keyHookers[i](e);
    	}
    }

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
    	context.globalCompositeOperation = GCO;
        context.strokeStyle = $(this).css('background-color');
        penStyle=context.strokeStyle;
        isEraser=false;
        canvas.style.cursor = "url('images/pencil.png'), auto";
    });

    $('#tool_eraser').click(function() {
    	context.globalCompositeOperation = "destination-out";
    	context.strokeStyle = "rgba(0,0,0,1)";
    	isEraser=true;
    	canvas.style.cursor = "url('images/eraser_cur.png'), auto";
    });

    $('#tool_pen').click(function() {
    	context.globalCompositeOperation = GCO;
    	context.strokeStyle=penStyle;
    	isEraser=false;
    	canvas.style.cursor = "url('images/pencil.png'), auto";
    });

    $('#tool_clear').click(function(e) {
        e.preventDefault();
        context.clearRect(0, 0, $('canvas').width(), $('canvas').height());
    });

    $('#tool_text').click(function() {
    	var chatMessage = window.prompt("チャット入力（40文字まで）　\n\"#del\",\"#削除\"で現在のチャット内容を削除します","");
    	if(chatMessage!=null && chatMessage.length>0){
    		if(chatMessage.length > 40){
    			alert("入力できる文字は40文字までです！");
    		}else{
    			socket.send(JSON.stringify({ cmd:"chat", session: sessionId, message:chatMessage }));
    		}
    	}else{}
    });

    $('select#select_theme').change(function() {
    	var theme=$("option:selected", theme).text();
    	var string1='tool_button ';
    	$('#panel_console').attr('class', theme);
    	$('#tool_pen').attr('class', string1.concat(theme));
    	$('#tool_text').attr('class', string1.concat(theme));
    	$('#tool_image').attr('class', string1.concat(theme));
    	$('#tool_save').attr('class', string1.concat(theme));
    	$('#tool_clear').attr('class', string1.concat(theme));
    	$('#tool_newp').attr('class', string1.concat(theme));
    	$('#tool_delp').attr('class', string1.concat(theme));
    	$('#tool_eraser').attr('class', string1.concat(theme));
    	$('#panel_timer').attr('class', theme);
    	if(theme=='Dark'){
    		$('#select_theme').attr('style','background-color:grey;');
    		$('.options').attr('style','background-color:grey;');
    		$('#timer_text').attr('style','background-color:grey;');
    		$('#timer_button').attr('style','background-color:grey;');
    		$('#theme_text').attr('style','color:grey;');
    	}else{
    		$('#select_theme').attr('style','background-color:auto;');
    		$('.options').attr('style','background-color:auto;');
    		$('#timer_text').attr('style','background-color:auto;');
    		$('#timer_button').attr('style','background-color:auto;');
    		$('#theme_text').attr('style','color:auto;');
    	}
    });

    function draw(e) {
        var toX = e.pageX - $('canvas').offset().left - offset;
        var toY = e.pageY - $('canvas').offset().top - offset;
        context.lineWidth = 2;
        if(isEraser){
        	context.lineWidth = 10;
        }
        context.beginPath();
        context.moveTo(fromX, fromY);
        context.lineTo(toX, toY);
        context.stroke();
        context.closePath();

        // サーバへメッセージ送信
        socket.send(JSON.stringify({ cmd:"pen", page: currentPage, fx:fromX, fy:fromY, tx:toX, ty:toY, color:context.strokeStyle }));
        fromX = toX;
        fromY = toY;
    }

    canvasToMinimizeBase64 = function(canvas) {
        var ctx = canvas.getContext('2d');
        // 小さいキャンバスを作成
        // 800x600の解像度だとJavascriptのWebsocketで送れるデータ量上限に引っかかって送れない
		// 苦肉の策として同じ4:3の576x432にした
        var canvas2 = $("<canvas/>")[0];
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

    slicePushImage = function(cmd, page, text, byte) {
    	var count = Math.ceil(text.length/byte)-1;
    	var uuid = getUuid();
    	for (var i=(count)*byte; i > -1; i-=byte){
	        socket.send(JSON.stringify({cmd: cmd, page_num: page, uuid: uuid, count: count, image: text.slice(i, i+byte)}));
    		count--;
    	}
    }

    function getUuid() {
    	var uuid = "", i, random;
    	for (i = 0; i < 32; i++) {
    		random = Math.random() * 16 | 0;
    		if (i == 8 || i == 12 || i == 16 || i == 20) {
    			uuid += "-"
    		}
    		uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
    	}
    	return uuid;
	}

    idraw.newPage = function() {
    	socket.send(JSON.stringify({cmd: "new_page", page_num: currentPage+1}));
    }
    idraw.delPage = function() {
    	if (currentPage > 0) {
        	if(window.confirm('ページを削除しますか？(削除はすぐに他のユーザに影響します)')){
        		socket.send(JSON.stringify({cmd: "del_page", page_num: currentPage}));
        	}
    	}
    }
    
    idraw.changePage = function(pageNum) {
    	// 絵を保存
		pagerJson[currentPage]["image"] = $("#canvas")[0].toDataURL("image/png");
		// タイマー保存
		$("#timer_text").val(pagerJson[pageNum]["timerSec"] != null ? pagerJson[pageNum]["timerSec"] : "タイマー");
		// 絵を読み込み
		if (pagerJson[pageNum]["image"] != null) {
			var image = new Image();
			image.src = pagerJson[pageNum]["image"];
			image.onload = function(){
				// 画像の読み込みが終わったら、Canvasに画像を反映する。
				var ctx = $("#canvas")[0].getContext("2d");
				ctx.clearRect(0, 0, 800, 600);
				ctx.drawImage(image, 0, 0);
			}
		}else{
			var ctx = $("#canvas")[0].getContext("2d");
			ctx.clearRect(0, 0, 800, 600);
		}
		// 背景を読み込み
		if (pagerJson[pageNum]["bg_image"] != null) {
			$("#panel_canvas").css("background-image", "url('" + pagerJson[pageNum]["bg_image"] + "')");
		}else{
			$("#panel_canvas").css("background-image", "");
		}
		currentPage = pageNum;
		if (currentPage > 0) {
			$("#page_num").text(currentPage);
		} else {
			$("#page_num").text("");
		}
    }

    clearText = function(str){
    	$("#"+str).val("");
    }
    
    writeTimer = function(str){
    	if($("#"+str).val() == ""){
    		$("#"+str).val("タイマー");
    	}
    }
}