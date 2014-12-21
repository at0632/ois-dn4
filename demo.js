var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";

var trenutniEHR='';

function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) + "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}


function kreirajEHRzaBolnika() {
	var ime = $("#kreirajIme").val();
	var priimek = $("#kreirajPriimek").val();
	var spol = $("#kreirajSpol").val();
	var datumRojstva = $("#datetimepicker").val();
	console.log(datumRojstva);
	var kraj = $("#kreirajKraj").val(); //check

	if (!ime || !priimek || !datumRojstva || !kraj || !spol || ime.trim().length == 0 || priimek.trim().length == 0 || datumRojstva.trim().length == 0) {
		$("#kreirajSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		$.ajax({
		    url: baseUrl + "/ehr",
		    type: 'POST',
		    success: function (data) {
		        var ehrId = data.ehrId;
		        var partyData = {
		            firstNames: ime,
		            lastNames: priimek,
		            gender: spol,
		            dateOfBirth: datumRojstva,
		            address: {address: kraj},
		            partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
		        };
		        $.ajax({
		            url: baseUrl + "/demographics/party",
		            type: 'POST',
		            contentType: 'application/json',
		            data: JSON.stringify(partyData),
		            success: function (party) {
		                if (party.action == 'CREATE') {
		                    $("#kreirajSporocilo").html("<span class='obvestilo label label-success fade-in'>Uspešno kreiran EHR '" + ehrId + "'.</span>");
		                    
							console.log("Uspešno kreiran EHR '" + ehrId + "'.");
							trenutniEHR=ehrId; //check
		                    $("#preberiEHRid").val(ehrId);
		                }
		            },
		            error: function(err) {
		            	$("#kreirajSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
		            	console.log(JSON.parse(err.responseText).userMessage);
		            }
		        });
		    }
		});
	}
}


function preberiEHRodBolnika() {
	
	console.log(sessionId);
	var ehrId = trenutniEHR; //$("#preberiEHRid").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#preberiSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#2").show();
				$("#sporocilo").html("<span class='obvestilo label label-success fade-in'>Bolnik '" + party.firstNames + " " + party.lastNames + "', ki se je rodil '" + party.dateOfBirth + "'.</span>");
				console.log("Bolnik '" + party.firstNames + " " + party.lastNames + "', ki se je rodil '" + party.dateOfBirth + ", " + party.address.address + ", " + party.gender);
			},
			error: function(err) {
				$("#preberiSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
				console.log(JSON.parse(err.responseText).userMessage);
			}
		});
	}	
}


function dodajMeritveVitalnihZnakov() {
	console.log(sessionId);
	var ehrId =trenutniEHR; //$("#dodajVitalnoEHR").val();
	
	var datumInUra = $("#dodajVitalnoDatumInUra").val();
	var telesnaVisina = $("#dodajVitalnoTelesnaVisina").val();
	var telesnaTeza = $("#dodajVitalnoTelesnaTeza").val();
	var telesnaTemperatura = $("#dodajVitalnoTelesnaTemperatura").val();
	var sistolicniKrvniTlak = $("#dodajVitalnoKrvniTlakSistolicni").val();
	var diastolicniKrvniTlak = $("#dodajVitalnoKrvniTlakDiastolicni").val();
	var utrip = $("#dodajVitalnoSrcniUtrip").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		var podatki = {
			// Preview Structure: https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
		    "ctx/language": "en",
		    "ctx/territory": "SI",
		    "ctx/time": datumInUra,
		    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
		    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
		   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
		    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
		    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
		    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
		    "vital_signs/pulse/any_event/rate": utrip
		};
		var parametriZahteve = {
		    "ehrId": ehrId,
		    templateId: 'Vital Signs',
		    format: 'FLAT'
		};
		$.ajax({
		    url: baseUrl + "/composition?" + $.param(parametriZahteve),
		    type: 'POST',
		    contentType: 'application/json',
		    data: JSON.stringify(podatki),
		    success: function (res) {
		    	console.log(res.meta.href);
		        $("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-success fade-in'>" + res.meta.href + ".</span>");
		    },
		    error: function(err) {
		    	$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
				console.log(JSON.parse(err.responseText).userMessage);
		    }
		});
	}
	$("#vnos2").hide();
}


function preberiMeritveVitalnihZnakov() {
	console.log(sessionId);

	var ehrId =trenutniEHR;// $("#meritveVitalnihZnakovEHRid").val();
	var tip = $("#preberiTipZaVitalneZnake").val();

	if (!ehrId || ehrId.trim().length == 0 || !tip || tip.trim().length == 0) {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
	    	type: 'GET',
	    	headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#rezultatMeritveVitalnihZnakov").html("<br/><span>Pridobivanje podatkov za <b>'" + tip + "'</b> bolnika <b>'" + party.firstNames + " " + party.lastNames + "'</b>.</span><br/><br/>");
				if (tip == "telesna temperatura") {
					$.ajax({
					    url: baseUrl + "/view/" + ehrId + "/" + "body_temperature",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						    	var results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-right'>Telesna temperatura</th></tr>";
						       
								for (var i in res) {
						            results += "<tr><td>" + res[i].time + "</td><td class='text-right'>" + res[i].temperature + " " 	+ res[i].unit + "</td>";
						        
								}
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
					    	} else {
					    		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
							console.log(JSON.parse(err.responseText).userMessage);
					    }
					});
				} else if (tip == "telesna teža") {
					$.ajax({
					    url: baseUrl + "/view/" + ehrId + "/" + "weight",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						    	var results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-right'>Telesna teža</th></tr>";
						        for (var i in res) {
						            results += "<tr><td>" + res[i].time + "</td><td class='text-right'>" + res[i].weight + " " 	+ res[i].unit + "</td>";
						        }
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
					    	} else {
					    		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
							console.log(JSON.parse(err.responseText).userMessage);
					    }
					});					
				} else if (tip == "telesna temperatura AQL") {
					var AQL = 
						"select " +
    						"t/data[at0002]/events[at0003]/time/value as cas, " +
    						"t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/magnitude as temperatura_vrednost, " +
    						"t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/units as temperatura_enota " +
						"from EHR e[e/ehr_id/value='" + ehrId + "'] " +
						"contains OBSERVATION t[openEHR-EHR-OBSERVATION.body_temperature.v1] " +
						"where t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/magnitude<35 " +
						"order by t/data[at0002]/events[at0003]/time/value desc " +
						"limit 10";
					$.ajax({
					    url: baseUrl + "/query?" + $.param({"aql": AQL}),
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	var results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-right'>Telesna temperatura</th></tr>";
					    	if (res) {
					    		var rows = res.resultSet;
						        for (var i in rows) {
						            results += "<tr><td>" + rows[i].cas + "</td><td class='text-right'>" + rows[i].temperatura_vrednost + " " 	+ rows[i].temperatura_enota + "</td>";
						        }
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
					    	} else {
					    		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
					    	}

					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
							console.log(JSON.parse(err.responseText).userMessage);
					    }
					});
				}
	    	},
	    	error: function(err) {
	    		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
				console.log(JSON.parse(err.responseText).userMessage);
	    	}
		});
	}
}

function preberi1(){
	var ehrId=trenutniEHR;
	if (ehrId){
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
	    	type: 'GET',
	    	headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#rezultatMeritveVitalnihZnakov").html("<br/><span>Pridobivanje podatkov za <b>''</b> bolnika <b>'" + party.firstNames + " " + party.lastNames + "'</b>.</span><br/><br/>");
					$.ajax({
					    url: baseUrl + "/view/" + ehrId + "/" + "body_temperature",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
							if (res.length > 0) {
						    	var results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-right'>Telesna temperatura</th></tr>";
						       
								for (var i in res) {
						            results += "<tr><td>" + res[i].time + "</td><td class='text-right'>" + res[i].temperature + " " 	+ res[i].unit + "</td>";
						        
								}
						        results += "</table>";
						        $("#rezultat1").html(results);
					    	} else {
					    		$("#retultat1").append("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
							console.log(JSON.parse(err.responseText).userMessage);
					    }
				});
			},
			error: function(err) {
	    		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
				console.log(JSON.parse(err.responseText).userMessage);
	    	}
		});
	
	}

}
function novo(){
	$("#vnos1").show();
	$("#preberiPredlogoBolnika").hide();
}

function nova(){
	$("#vnos2").show();
}
function nadaljuj(){
	if(trenutniEHR==''){
	trenutniEHR=$("#preberiPredlogoBolnika").find('option:selected').val();
	}
	if(trenutniEHR){
		preberiEHRodBolnika();
		itm();
		$("#1").hide();
		$("#3").show();
		$("#4").show();
		preveri();
		
		
	}else{
		$("#kreirajSporocilo").text("nnn");
	}
}
function datetime(){
	$('#datetimepicker1').datetimepicker();
}


function generator(){
	var zadnjiVnos='';
	var ehrId=trenutniEHR;
	if (ehrId){
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
	    	type: 'GET',
	    	headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
					$.ajax({
					    url: baseUrl + "/view/" + ehrId + "/" + "body_temperature",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
							zadnjiVnos=res[0];
					    },
					    error: function() {
							console.log(JSON.parse(err.responseText).userMessage);
					    }
				});
			},
			error: function(err) {
				console.log(JSON.parse(err.responseText).userMessage);
	    	}
		});
	}
	
	



}
var jsonArr = [];
function itm(){
	var ehrId=trenutniEHR;
	
	if (ehrId){
		$.ajax({
			url: baseUrl + "/view/" + ehrId + "/" + "weight",
		    type: 'GET',
		    headers: {"Ehr-Session": sessionId},
		    success: function (res) {
		    	if (res.length > 0) {
					$.ajax({
						url: baseUrl + "/view/" + ehrId + "/" + "height",
						type: 'GET',
						headers: {"Ehr-Session": sessionId},
						success: function (res2) {
						if (res2.length > 0) {
							var itm = res[0].weight/((res2[0].height/100)*(res2[0].height/100));
								if(itm<18.5)
									
									$("#rez").append("<span>ITM kaže na podhranjenost</span>");
								else if(itm<25)
									$("#rez").append("<span>ITM kaže na podhranjenost</span>");
								else if(itm<30)
									$("#rez").append("<span>ITM kaže na podhranjenost</span>");
								else if(itm<35)
									$("#rez").text("ITM kaže na podhranjenost");
								else if(itm<40)
									$("#rez").text("ITM kaže na podhranjenost");
								else
									$("#rez").text("ITM kaže na podhranjenost");
							var a=10;
							for (var i in res) {
								if(i<10){
									
									/*console.log(res[i].time);
									console.log(res[i].weight);
									console.log(res2[i].height);*/
									tmp=res[i].weight/((res2[i].height/100)*(res2[i].height/100));
									
									jsonArr.push({
										x: a,
										y: tmp
									});
									a=a+10;
									
									
								}
							}
							
						
							izrisi1();
						} else {
					    		
						}
						},
						error: function() {
						console.log(JSON.parse(err.responseText).userMessage);
						}
					});
					
				} else {
					    		
				}
			},
			error: function() {
			console.log(JSON.parse(err.responseText).userMessage);
			}
		});	
	}
	
	
}
function odpri1(){
	$("#5").show();
	$("#ortopedija").show();
	$("#pediatrija").hide();
	$("#kardiologija").hide();
}
var jsonArr2 = [];
function temp(){
	var ehrId=trenutniEHR;
	
	if (ehrId){
		$.ajax({
			url: baseUrl + "/view/" + ehrId + "/" + "body_temperature",
		    type: 'GET',
		    headers: {"Ehr-Session": sessionId},
		    success: function (res) {
		    	if (res.length > 0) {
					if(res[0].temperature<35 || res[0].temperature>37.5){
						$("#rez1").append("<span>Temperatura ni normalna.</span>");
					}else{
						$("#rez1").append("<span>Temperatura je normalna.</span>");
					}
					
					for (var i in res) {
						if(res[i].time>Date()+5){
						
						jsonArr2.push({
						x: a,
						y: res[i].temperature
						});
						}
					
					}
					
					
					
					
					izrisi2();
					
				} else {
					   $("#rez2").append("<span>Temperatura ni na voljo</span>"); 		
				}
			},
			error: function() {
			console.log(JSON.parse(err.responseText).userMessage);
			}
		});	
	}


}

function preveri(){
	
/*

ITM (kg/m2	Klasifikacija	Tveganje za bolezensko stanje
< 18.5	podhranjenost	majhno (povečano tveganje za druge klinične težave)
18.5–24.9	normalna prehranjenost	povprečno
= 25.0	prekomerna prehranjenost	 
25.0–29.9	pred-debelost	povečano
30.0–34.9	debelost – 1. st	zmerno povečano
35.0–39.9	debelost – 2. st	močno povečano
= 40	debelost – 3. st	zelo močno povečano
*/
	
	/*if(skt<110)
		//prenizek
	else if(skt<120)
		//optimalen
	else if(skt<130)
		//normalen
	else if(skt<139)
		//visoko normalen
	else
		//nujen pregled (arterijska hipertenzija)
	
	if(dkt<60)
		//prenizek
	else if(dkt<80)
		//optimalen
	else if(dkt<85)
		//normalen
	else if(dkt<89)
		//visoko normalen
	else
		//nujen pregled (arterijska hipertenzija)
	
	if(59<puls<100){
	
	}else
		
	
	var itm = teza/vis*vis;
	if(itm<18.5)
		//pohranjenost
	else if(itm<25)
	
	else if(itm<30)
	else if(itm<35)
	else if(itm<40)
	else*/
}

function izrisi1(){

console.log(jsonArr);

var lineData = [{x: 1,y: 100}, 
{x: 20,y: 120}, 
{x: 40,y: 130}, 
{x: 60,y: 150}, 
{x: 80,y: 80}, 
{x: 100,y: 170}];

console.log(lineData);

var vis = d3.select('#visualisation'),
     MARGINS = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 40
    },
	WIDTH = $("#test").width()-30,
	
    HEIGHT = 300,
   
    xRange = d3.scale.linear()
	.range([MARGINS.left, WIDTH - MARGINS.right])
	.domain([d3.min(jsonArr, function(d) {
      return d.x;
    }), d3.max(jsonArr, function(d) {
      return d.x;
    })]),
    yRange = d3.scale.linear()
	.range([HEIGHT - MARGINS.top, MARGINS.bottom])
	.domain([d3.min(jsonArr, function(d) {
      return 5;
    }), d3.max(jsonArr, function(d) {
      return 45;
    })]),
    xAxis = d3.svg.axis()
      .scale(xRange)
      .tickSize(5)
      .tickSubdivide(true),
    yAxis = d3.svg.axis()
      .scale(yRange)
      .tickSize(5)
      .orient('left')
      .tickSubdivide(true);
 
vis.append('svg:g')
  .attr('class', 'x axis')
  .attr('transform', 'translate(0,' + (HEIGHT - MARGINS.bottom) + ')')
  .call(xAxis);
 
vis.append('svg:g')
  .attr('class', 'y axis')
  .attr('transform', 'translate(' + (MARGINS.left) + ',0)')
  .call(yAxis);
  var lineFunc = d3.svg.line()
  .x(function(d) {
    return xRange(d.x);
  })
  .y(function(d) {
    return yRange(d.y);
  })
  .interpolate('linear');
  vis.append('svg:path')
  .attr('d', lineFunc(jsonArr))
  .attr('stroke', 'blue')
  .attr('stroke-width', 2)
  .attr('fill', 'none');

}


function izrisi2(){

if(jsonArr2.length>0){
var vis = d3.select('#vis2'),
     MARGINS = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 40
    },
	WIDTH = $("#test2").width()-30,
	
    HEIGHT = 300,
   
    xRange = d3.scale.linear()
	.range([MARGINS.left, WIDTH - MARGINS.right])
	.domain([d3.min(jsonArr2, function(d) {
      return d.x;
    }), d3.max(jsonArr2, function(d) {
      return d.x;
    })]),
    yRange = d3.scale.linear()
	.range([HEIGHT - MARGINS.top, MARGINS.bottom])
	.domain([d3.min(jsonArr2, function(d) {
      return 30;
    }), d3.max(jsonArr2, function(d) {
      return 45;
    })]),
    xAxis = d3.svg.axis()
      .scale(xRange)
      .tickSize(5)
      .tickSubdivide(true),
    yAxis = d3.svg.axis()
      .scale(yRange)
      .tickSize(5)
      .orient('left')
      .tickSubdivide(true);
 
vis.append('svg:g')
  .attr('class', 'x axis')
  .attr('transform', 'translate(0,' + (HEIGHT - MARGINS.bottom) + ')')
  .call(xAxis);
 
vis.append('svg:g')
  .attr('class', 'y axis')
  .attr('transform', 'translate(' + (MARGINS.left) + ',0)')
  .call(yAxis);
  var lineFunc = d3.svg.line()
  .x(function(d) {
    return xRange(d.x);
  })
  .y(function(d) {
    return yRange(d.y);
  })
  .interpolate('linear');
  vis.append('svg:path')
  .attr('d', lineFunc(jsonArr2))
  .attr('stroke', 'blue')
  .attr('stroke-width', 2)
  .attr('fill', 'none');
}else{
	d3.select("#vis2").append("g").text("Ni podatkov");

}
	

}
//ortopedija -parsanje
function zasebno(){
	$.ajax({
	url: 'http://zdravniki-zobozdravniki.net/Iskalnik?specializations=23',
    type: 'GET',
	crossDomain : true,
    success: function( data ) {
		pdata.getDocumentByTag("h3")
		console.log(data);
	}
	});
}
$(document).ready(function() {
	sessionId = getSessionId();
	
	$('#preberiObstojeciEHR').change(function() {
		$("#preberiSporocilo").html("");
		$("#preberiEHRid").val($(this).val());
	});
	$('#preberiPredlogoBolnika').change(function() {
		$("#kreirajSporocilo").html("");
		var podatki = $(this).val().split(",");
		$("#kreirajIme").val(podatki[0]);
		$("#kreirajPriimek").val(podatki[1]);
		$("#kreirajDatumRojstva").val(podatki[2]);
	});
	$('#preberiObstojeciVitalniZnak').change(function() {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("");
		var podatki = $(this).val().split("|");
		$("#dodajVitalnoEHR").val(podatki[0]);
		$("#dodajVitalnoDatumInUra").val(podatki[1]);
		$("#dodajVitalnoTelesnaVisina").val(podatki[2]);
		$("#dodajVitalnoTelesnaTeza").val(podatki[3]);
		$("#dodajVitalnoTelesnaTemperatura").val(podatki[4]);
		$("#dodajVitalnoKrvniTlakSistolicni").val(podatki[5]);
		$("#dodajVitalnoKrvniTlakDiastolicni").val(podatki[6]);
		$("#dodajVitalnoNasicenostKrviSKisikom").val(podatki[7]);
		$("#dodajVitalnoMerilec").val(podatki[8]);
	});
	$('#preberiEhrIdZaVitalneZnake').change(function() {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("");
		$("#rezultatMeritveVitalnihZnakov").html("");
		$("#meritveVitalnihZnakovEHRid").val($(this).val());
	});
});