var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require("fs");
var path = require("path");

var userData=[],webPages=[],points=[],usedPoints=[];
var i,j,k,pointsAwarded,webPageId=0,nameWithoutExtension,splitNameWithoutExtension=[],numPoints,webpagesSent=0,webPageDate,currentUsername,usernameValue;
var splitKeyword=[],webpageData=[];
var usernameExists=false,passwordExists=false,login=false,userExists=false,fileExist=false;
var hours,time,newKeyword,points;
const programFiles =["register.html","login.html","search.html","update.html","communications.js"];
const port = process.env.PORT || 60274;
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];




app.get('/', function (req, res) {
	
	res.sendfile("register.html");
});

app.get('/:file',function(req,res){
	
	

		
		if(programFiles.includes(req.params.file)){
		
			if(req.params.file == 'register.html'){
				res.sendfile("register.html");
			}
		
			else if(req.params.file == 'login.html'){
				res.sendfile("login.html");
			}
		
			else if(req.params.file == 'search.html'){
				res.sendfile("search.html");
			}
		
			else if(req.params.file == 'update.html'){
				res.sendfile("update.html");
			}
			
			else{
				res.send("File does not exist");
			}
			
		
		}
	
		else if(!programFiles.includes(req.params.file)){
		
			for(i=0;i<=webPages.length-1;i++){
			
				if(webPages[i].id.toString()+webPages[i].name == req.params.file){
					fileExist=true;
				
				}
			
			}
		
			if(fileExist){
				res.sendfile(req.params.file);
			}
		
			else if(!fileExist){
				res.send("File does not exist");
			}
		
			fileExist=false;
		}
	
	

});




// if connection is recieved through socket check for data being sent 
io.on('connection', function(socket) {
	
	socket.on("validateRegisterInfo",function(data){
		
		usernameExists=false;
		passwordExists=false;
		
		for(i=0;i<=userData.length-1;i++){
			
			if(userData[i].username == data.username){
				usernameExists=true;
			}
			if(userData[i].password == data.password){
				passwordExists=true;
			}
		}
		
		socket.emit("isRegisterInfoNew",{usernameStatus:usernameExists,passwordStatus:passwordExists});

	});
	
	socket.on("register",function(data){
		userData.push({username:data.username,password:data.password,profileImg:'<img width="100" height="100" onerror="invalidProfileImage()"id="profile" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRm_kVdMwEYyU95pNWTknAUfKokV1owQDTaVA&usqp=CAU">'});

	});
	
	socket.on("validateLoginInfo",function(data){
		
		login=false;
		
		for(i=0;i<=userData.length-1;i++){
			
			if(userData[i].username==data.username && userData[i].password==data.password){
				login=true;
			}
		}
		
		socket.emit("login",login);
	});
	
	socket.on("checkUser",function(data){
		
		registered=false;
		usernameValue="";
		
		for(i=0;i<=userData.length-1;i++){
			
			if(userData[i].username == data.username && userData[i].password == data.password){
				usernameValue=userData[i].username;
				registered=true;
			}
		}

		socket.emit("userRegistered",{username:usernameValue,isRegistered:registered});
	});
	
	
	socket.on("update",function(data){
		
		for(i=0;i<=userData.length-1;i++){
			
			if(userData[i].username==data.oldUsername && userData[i].password==data.oldPassword){
				userData[i].username=data.newUsername;
				userData[i].password=data.newPassword;
			}
		}
	});
	
	socket.on("getWebPages",function(){
		
		webpagesSent=0;
		
		for(i=0;i<=webPages.length-1;i++){
			
			if(webpagesSent <=50){
				io.sockets.emit("getWebPage",webPages[i]);
				
				webpagesSent++;
			}
		}
	});
	
	socket.on("getTitleWebPages",function(keyword){
		
		webpageData=[];
		points=[];
		usedPoints=[];
		
		keyword=keyword.trim();
		
		keyword=keyword.split(" ");
		
		newKeyword="";
		
		for(i=0;i<=keyword.length-1;i++){
			
			if(keyword[i].trim().length != 0){
				
				newKeyword+=keyword[i]+" ";;
					
			}
		}
		
		newKeyword = newKeyword.slice(0,newKeyword.length-1);
		keyword=newKeyword;
		

		
		for(i=0;i<=webPages.length-1;i++){
			
			pointsAwarded=0;
			
			for(j=0,k=0;j<=keyword.length-1 && k<=webPages[i].title.length-1;j++,k++){
				
				if(webPages[i].title[k].toLowerCase() == keyword[j].toLowerCase()){
					pointsAwarded++;
				}
			}
			
			webpageData.push({webpage:webPages[i],points:pointsAwarded});
		}
		
		
		
		splitKeyword=keyword.split(" ");
		
		for(i=0;i<=webPages.length-1;i++){
			
			pointsAwarded=0;
			
			for(j=0,k=0;j<=splitKeyword.length-1 && k<=webPages[i].title.split(" ").length-1;j++,k++){
				
				if(splitKeyword[j].trim().length != 0){
					
					if(webPages[i].title.toLowerCase().split(" ").includes(splitKeyword[j].toLowerCase())){
						pointsAwarded+=splitKeyword[j].length;
					}
				
					else if(!webPages[i].title.toLowerCase().split(" ").includes(splitKeyword[j].toLowerCase())){
						pointsAwarded--;
					}
				
					if(webPages[i].title.toLowerCase().split(" ")[k] == splitKeyword[j].toLowerCase()){
						pointsAwarded+=splitKeyword[j].length;
					}
					
				}
				
			}
			
			
			webpageData[i].points+=pointsAwarded;
			points.push(webpageData[i].points);
		}
		
		webpagesSent=0;
		
		points.sort();
		
		for(i=points.length-1;i>=0;i--){
			
			if(!usedPoints.includes(points[i])){
				
				for(j=webpageData.length-1;j>=0;j--){
				
					if(webpageData[j].points == points[i] && webpagesSent<=50){
					
						socket.emit("getTitleWebPage",webpageData[j].webpage);
					
						webpagesSent++;
					}
				}
			
				usedPoints.push(points[i]);
			
			}
		}
		
	});
	
	socket.on("getFileWebPages",function(keyword){
		
		webpageData=[];
		points=[];
		usedPoints=[];
		
		keyword=keyword.trim();
		
		keyword=keyword.split(" ");
		
		newKeyword="";
		
		for(i=0;i<=keyword.length-1;i++){
			
			if(keyword[i].trim().length != 0){
				
				newKeyword+=keyword[i]+" ";;
					
			}
		}
		
		newKeyword = newKeyword.slice(0,newKeyword.length-1);
		keyword=newKeyword;
		
	
		
		for(i=0;i<=webPages.length-1;i++){
			
			pointsAwarded=0;
			
			for(j=0,k=0;j<=keyword.length-1 && k<=webPages[i].name.length-1;j++,k++){
				
				if(webPages[i].name[k].toLowerCase() == keyword[j].toLowerCase()){
					pointsAwarded++;
				}
			}
			
			webpageData.push({webpage:webPages[i],points:pointsAwarded});
		}
		
		
		
		splitKeyword=keyword.split(" ");
		
		for(i=0;i<=webPages.length-1;i++){
			
			pointsAwarded=0;
			
			for(j=0,k=0;j<=splitKeyword.length-1 && k<=webPages[i].name.split(" ").length-1;j++,k++){
				
				if(splitKeyword[j].trim().length != 0){
					
					if(webPages[i].name.toLowerCase().split(" ").includes(splitKeyword[j].toLowerCase())){
						pointsAwarded+=splitKeyword[j].length;
					}
				
					else if(!webPages[i].name.toLowerCase().split(" ").includes(splitKeyword[j].toLowerCase())){
						pointsAwarded--;
					}
				
					if(webPages[i].name.toLowerCase().split(" ")[k] == splitKeyword[j].toLowerCase()){
						pointsAwarded+=splitKeyword[j].length;
					}
					
				}
				
			}
			
			
			webpageData[i].points+=pointsAwarded;
			points.push(webpageData[i].points);
		}
		
		webpagesSent=0;
		
		points.sort();
		
		for(i=points.length-1;i>=0;i--){
			
			if(!usedPoints.includes(points[i])){
				
				for(j=webpageData.length-1;j>=0;j--){
				
					if(webpageData[j].points == points[i] && webpagesSent<=50){
					
						socket.emit("getFileWebPage",webpageData[j].webpage);
					
						webpagesSent++;
					}
				}
			
				usedPoints.push(points[i]);
			
			}
		}
		
	});
	
	socket.on("getDescriptionWebPages",function(keyword){
		
		webpageData=[];
		points=[];
		usedPoints=[];
		
		keyword=keyword.trim();
		
		keyword=keyword.split(" ");
		
		newKeyword="";
		
		for(i=0;i<=keyword.length-1;i++){
			
			if(keyword[i].trim().length != 0){
				
				newKeyword+=keyword[i]+" ";;
					
			}
		}
		
		newKeyword = newKeyword.slice(0,newKeyword.length-1);
		keyword=newKeyword;
		
	
		
		for(i=0;i<=webPages.length-1;i++){
			
			pointsAwarded=0;
			
			for(j=0,k=0;j<=keyword.length-1 && k<=webPages[i].description.length-1;j++,k++){
				
				if(webPages[i].description[k].toLowerCase() == keyword[j].toLowerCase()){
					pointsAwarded++;
				}
			}
			
			webpageData.push({webpage:webPages[i],points:pointsAwarded});
		}
		
		
		
		splitKeyword=keyword.split(" ");
		
		for(i=0;i<=webPages.length-1;i++){
			
			pointsAwarded=0;
			
			for(j=0,k=0;j<=splitKeyword.length-1 && k<=webPages[i].description.split(" ").length-1;j++,k++){
				
				if(splitKeyword[j].trim().length != 0){
					
					if(webPages[i].description.toLowerCase().split(" ").includes(splitKeyword[j].toLowerCase())){
						pointsAwarded+=splitKeyword[j].length;
					}
				
					else if(!webPages[i].description.toLowerCase().split(" ").includes(splitKeyword[j].toLowerCase())){
						pointsAwarded--;
					}
				
					if(webPages[i].description.toLowerCase().split(" ")[k] == splitKeyword[j].toLowerCase()){
						pointsAwarded+=splitKeyword[j].length;
					}
					
				}
				
			}
			
			
			webpageData[i].points+=pointsAwarded;
			points.push(webpageData[i].points);
			
		}
		
		webpagesSent=0;
		
		points.sort();
		
		for(i=points.length-1;i>=0;i--){
			
			if(!usedPoints.includes(points[i])){
				
				for(j=webpageData.length-1;j>=0;j--){
				
					if(webpageData[j].points == points[i] && webpagesSent<=50){
					
						socket.emit("getDescriptionWebPage",webpageData[j].webpage);
					
						webpagesSent++;
					}
				}
			
				usedPoints.push(points[i]);
			
			}
		}
		
	});
	
	socket.on("sendImageDataURL",function(file){
		
		for(i=0;i<=webPages.length-1;i++){
			
			if(webPages[i].id.toString()+webPages[i].name == file){
				socket.emit("getImageDataURL",{name:webPages[i].name,URL:webPages[i].code});
			}
			
		}
	});
	
	
	socket.on("webPageViewed",function(file){
		
		for(i=0;i<=webPages.length-1;i++){
			
			if(webPages[i].id.toString()+webPages[i].name == file){
				
				webPages[i].views++;
			}
			
		}
	});
	
	
	socket.on("getProfileImage",function(username){
		
		for(i=0;i<=userData.length-1;i++){
			
			if(userData[i].username == username){
				socket.emit("sendProfileImage",userData[i].profileImg);
			}
		}
	});
	
	socket.on("updateProfileImage",function(data){
		

		for(i=0;i<=userData.length-1;i++){
			
			if(userData[i].username == data.username){
				userData[i].profileImg=data.profileImg;
			
			}
		}
		
		for(i=0;i<=webPages.length-1;i++){
			
			if(webPages[i].username == data.username){
				webPages[i].profileImg=data.profileImg;
			}
		}
		
	});
	
	socket.on("getUserWebPages",function(username){

			webpagesSent=0;
			
			for(i=webPages.length-1;i>=0;i--){
				
				if(webpagesSent<=50 && webPages[i].username == username){
					socket.emit("getUserWebPage",webPages[i]);
					
					webpagesSent++;
				}
			}
	});
	
	socket.on("sendWebPage",function(data){
			
			if(data.name != "NO FILE ATTACHMENT"){
				
				data.name=data.name.slice(12,data.name.length);
				
				fs.writeFile(webPageId.toString()+data.name, data.code, function (err) {
				
				});
			}
			

			data.date = new Date(data.date);
			
			if(data.date.getHours()+1 < 13){
				hours=data.date.getHours();
				time=" am";
			}
			
			else if(data.date.getHours()+1 >= 13){
				hours=data.date.getHours()-12;
				time=" pm";
			}
			
			webPages.push({profileImg:data.profileImg,username:data.username,title:data.title,image:data.image,imageSrc:data.imageSrc,name:data.name,code:data.code,description:data.description,comments:"",views:0,dateString:months[data.date.getMonth()]+" "+data.date.getDate().toString()+", "+data.date.getFullYear().toString()+" at "+hours+":"+data.date.getMinutes()+time,id:webPageId,deleted:false});
			io.sockets.emit("getWebPage",{profileImg:data.profileImg,username:data.username,title:data.title,image:data.image,imageSrc:data.imageSrc,name:data.name,code:data.code,description:data.description,comments:"",views:0,dateString:months[data.date.getMonth()]+" "+data.date.getDate().toString()+", "+data.date.getFullYear().toString()+" at "+hours+":"+data.date.getMinutes()+time,id:webPageId,deleted:false});
			webPageId++;
			
	});
	
	socket.on("sendComments",function(file){
		
		for(i=0;i<=webPages.length-1;i++){
			if(webPages[i].id.toString()+webPages[i].name == file){
				socket.emit("getComments",webPages[i].comments);
			}
		}
	});
	
	socket.on("addComment",function(data){
		for(i=0;i<=webPages.length-1;i++){
			if(webPages[i].id.toString()+webPages[i].name == data.file){
				
				if(data.comment == ""){
					webPages[i].comments+="";
				}
				
				else if(data.comment !=""){
					webPages[i].comments+=data.comment+"~"+"~";
				}
			}
		}
	});
	
	socket.on("getRecentlyUploadedWebPages",function(){
		
		for(i=webPages.length-1;i>=webPages.length-20 && i>=0;i--){
			socket.emit("getRecentlyUploadedWebPage",webPages[i]);
	
		}
		
	});
	
	
	socket.on("deletePage",function(id){	
		
		for(i=0;i<=webPages.length-1;i++){
			
			if(webPages[i].id==id){
				
				fs.unlink(webPages[i].id.toString()+webPages[i].name, function (err) {
					
				});
				
				webPages[i].deleted=true;
				webPages[i].profileImg="";
				webPages[i].imageSrc="";
				webPages[i].username="";
				webPages[i].image="";
				webPages[i].name="";
				webPages[i].comments="";
				webPages[i].description="";
				webPages[i].code="";
				webPages[i].views=0;
			}
		}

	});
	
	socket.on("change",function(usernames){
	
		for(i=0;i<=webPages.length-1;i++){

			if(webPages[i].username == usernames.oldUsername){
				webPages[i].username=usernames.newUsername;
				
			}
			
		}
		
	});
	
});

	
http.listen(port, function() {
   console.log('listening on localhost'+port);
});