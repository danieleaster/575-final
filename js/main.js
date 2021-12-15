/* GEO 575 Group Project- Emily Johansen, Daniel Easter, Richard Helsley*/

function createMap() {
    //centered to mid/upper WI
    var map = L.map('map', {
        //center: [44.7, -90],
        zoom: 6.5,
        //minZoom: 4
    }).setView([44.7,-90],6.5);
    //Attempting to Troubleshoot this line, I can't figure out why this is being deemed to not be a funtion when it is a plugin. Specfically referencing the NavBar command.
    //It should be simply adding to the map but Java keeps identifying it as a function and I'm not sure how to correct it. 12.08.2021. RH
    L.Control.geocoder().addTo(map);
    //L.Control.navbar().addTo(map);
    
    
    //Base Layer for Map 
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
         attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
     }).addTo(map);


    // commented out to experiment with base layers.
    // //add forest green mapbox basemap tilelayer
    // var forest = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', { attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery   <a href="http://mapbox.com">Mapbox</a>', maxZoom: 18, id: 'emilyjo/ckuk9l61v7x8y19nybp6l6rhb', accessToken:'pk.eyJ1IjoiZW1pbHlqbyIsImEiOiJjazA2MDI4MjEwNWM2M3BxYm42N29rMDNoIn0.TCOSlqzEBB-uE8PDYUq4OA'}).addTo(map);

    // //add osm basemap tilelayer
    // var osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //     attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    // });

    // //define basemaps and add switcher control
    // var basemaps = {
    //     "Dark": forest,
    //     "Light": osm
    // };

    // L.control.layers(basemaps).addTo(map);
    

    //call getData function
    getData(map);
};


//Function to retrieve the data and place it on the map
function getData(map){
/*
    //load the data
    $.ajax("data/County_Boundaries_24K.geojson", {
        dataType: "json",
        success: function(response){
            //create an attributes array
            var attributes = processData(response);

            call function to create proportional symbols
            createPropSymbols(response, map, attributes);
            createSequenceControls(map, attributes);
            createLegend(map, attributes);
        }
    });
    */
    
    $.ajax("data/master.geojson", {
        dataType: "json",
        success: function(response){
            //create an attributes array
            var attributes = processData(response);

            //call function to create proportional symbols
            createPropSymbols(response, map, attributes);
            createSequenceControls(map, attributes);
            createLegend(map, attributes);
        }
    });
};


//=====================================================================================================================

//Function to build an attributes array from the data
function processData(data){

    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){

        //only take attributes with Year values
        if (attribute.indexOf("pc") > -1){
            attributes.push(attribute);
        };
    };
    return attributes;
};

//=====================================================================================================================

//Function to calculate the max, mean, and min values for a given attribute
function getCircleValues(map, attribute){

    //start with min at highest possible and max at lowest possible number
    var min = Infinity,
        max = -Infinity;

    map.eachLayer(function(layer){

        //get the attribute value
        if (layer.feature){
            var attributeValue = Number(layer.feature.properties[attribute]);

            //test for min
            if (attributeValue < min){
                min = attributeValue;
            };

            //test for max
            if (attributeValue > max){
                max = attributeValue;
            };
        };
    });

    //set mean
    var mean = (max + min) / 2;

    //return values as an object
    return {
        max: max,
        mean: mean,
        min: min
    };
};

//=====================================================================================================================
//PROPORTIONAL SYMBOLS

//Function to calculate the radius of each proportional symbol
function calcPropRadius(attValue) {

    //scale factor to adjust symbol size evenly
    var scaleFactor = 10000
;

    //area based on attribute value and scale factor
    var area = attValue * scaleFactor;

    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);

    return radius;
};

//Function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){

    //Determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];

    //create marker options
    var options = {
        fillColor: "#004d1a",
        color: "#004d1a",
        weight: 8,
        opacity: 1,
        fillOpacity: 0.8
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //create new popup
    var popup = new Popup(feature.properties, attribute, layer, options.radius);

    //add popup to circle marker
    popup.bindToLayer();

    //original popupContent changed to panelContent...Example 2.2 line 1
    var panelContent = "<p> " + feature.properties.City + ": " + feature.properties.location + "</p>" + feature.properties.detail +"<p>"+ "Source: " + feature.properties.source
    ;

    //add formatted attribute to panel content string
    var year = attribute.split("_")[1];
    panelContent += feature.properties + " million ";

    //event listeners to open popup on hover
    layer.on({
        mouseover: function(){
            this.openPopup();
            this.setStyle({fillColor: 'green'});
        },
        mouseout: function(){
            this.closePopup();
            this.setStyle({fillColor: '#00cc44'});
        },
        click: function(){
            $("#panel").html(panelContent);
        }
    });

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

//Function to add circle markers for point features to the map
function createPropSymbols(data, map, attributes){

    //create a Leaflet GeoJSON layer and add it to the map
    var markers = L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    });
    markers.addTo(map);
};

//Function to resize the proportional symbols according to new attribute values
function updatePropSymbols(map, attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){

            //access feature properties
            var props = layer.feature.properties;

            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            //create popup content
            var popup = new Popup(props, attribute, layer, radius);

            //add popup to circle marker
            popup.bindToLayer();
        };
    });

    updateLegend(map, attribute);
};

//=====================================================================================================================
//POP UPS

//Function to create marker popups
function Popup(properties, attribute, layer, radius){
    this.properties = properties;
    this.attribute = attribute;
    this.layer = layer;
    this.year = attribute.split("_")[1];
    this.population = this.properties[attribute];
    //"There were ## antlered deer per square county mile in 'year' in 'county' County.
    //this.content = "<p><b>There were " + (this.population) + " deer that tested positive in " + this.properties.county + " County in " + this.year + ".</b></p>";
    this.content = this.properties.county + " - " + this.year + "</br>" + this.properties. + " carcasses tested" + " </br> " + (this.population*100).toFixed(2) + "% positive tests"

    this.bindToLayer = function(){
        this.layer.bindPopup(this.content, {
            offset: new L.Point(0,-radius)
        });
    };
};

//Function to attach popups to each mapped feature
function onEachFeature(feature, layer) {

    //create html string with all properties
    var popupContent = "";
    if (feature.properties) {

        //loop to add feature property names and values to html string
        for (var property in feature.properties){
            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
        }
        layer.bindPopup(popupContent);
    };
};

//=====================================================================================================================
//LEGEND

//Function to create the legend
function createLegend(map, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function (map) {

            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            //add temporal legend div to container
            $(container).append('<div id="temporal-legend">')

            //start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="280px" height="100px">';

            //array of circle names to base loop on
            var circles = {
                max: 40,
                mean: 60,
                min: 80
            };

            //loop to add each circle and text to svg string
            for (var circle in circles){

                //circle string
                svg += '<circle class="legend-circle" id="' + circle + '" fill="#004d1a" fill-opacity="0.8" stroke="#000000" cx="60"/>';

            //text string
            svg += '<text id="'+ circle +'-text" x="95" y="'+ circles[circle] +'"></text>';

            };

            //close svg string
            svg += "</svg>";

            //add attribute legend svg to container
            $(container).append(svg);

            return container;
        }
    });

    map.addControl(new LegendControl());

    updateLegend(map, attributes[0]);
};

//Function to update the legend based on new attribute values
function updateLegend(map, attribute){

    //create content for legend
    var year = attribute.split("_")[1];
    var content = "<b>Number of deer that tested<br><br><br>positive for CWD in " + year + "</b><br><br><br>max / mean / min";


    //replace legend content
    $('#temporal-legend').html(content);

    //get the max, mean, and min values as an object
    var circleValues = getCircleValues(map, attribute);

    for (var key in circleValues){

        //get the radius
        var radius = calcPropRadius(circleValues[key]);

        //assign the cy and r attributes
        $('#'+key).attr({
            cy: 60 - radius,
            r: radius + radius
        });

        //add legend text
        $('#'+key+'-text').text(Math.round(circleValues[key]) + " ");
    };
};

//=====================================================================================================================
//CONTROLS

//Function to create the temporal controls
function createSequenceControls(map, attributes){
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function (map) {

            //create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            //create range input slider
            $(container).append('<input class="range-slider" type="range">');

            //create range input element (buttons)
            $(container).append('<button class="skip" id="reverse">Reverse</button>');
            $(container).append('<button class="skip" id="forward">Skip</button>');

            //kill any mouse event listeners on the map
            $(container).on('mousedown dblclick', function(e){
                L.DomEvent.stopPropagation(e);
            });
            $(container).mousedown(function () {
                map.dragging.disable();
            });
            $(document).mouseup(function () {
                map.dragging.enable();
            });


            return container;
        }
    });
    
    map.addControl(new SequenceControl());

    //replace button content with images
    $('#reverse').html('<img src="img/reverse.png">');
    $('#forward').html('<img src="img/forward.png">');

    //click listener for buttons
    $('.skip').click(function(){

        //get the old index value
        var index = $('.range-slider').val();

        //increment or decrement depending on button clicked
        if ($(this).attr('id') == 'forward'){
            index++;

            //if past the last attribute, wrap around to first attribute
            index = index > 18 ? 0 : index;
        } else if ($(this).attr('id') == 'reverse'){
            index--;

            //if past the first attribute, wrap around to last attribute
            index = index < 0 ? 18 : index;
        }

        //update slider
        $('.range-slider').val(index);
        updatePropSymbols(map, attributes[index]);
    });

    //set slider attributes
    $('.range-slider').attr({
        max: 18,
        min: 0,
        value: 0,
        step: 1,
    })

    //input listener for slider
    $('.range-slider').on('input',function(){

        //get the new index value
        var index = $(this).val();
        updatePropSymbols(map, attributes[index]);
        updateLegend(map, attributes[index]);

    });
    
};


//=====================================================================================================================

$(document).ready(createMap);
