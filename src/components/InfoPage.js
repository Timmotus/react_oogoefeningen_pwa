import React, {Component} from "react";
import "materialize-css";
import {Carousel} from "react-materialize";
import "./InfoPage.css";

export default class InfoPage extends Component {

    componentDidMount() {

    }

    render() {
        return (
            <div className="info-wrapper">
                <h1>Uitleg</h1>
                <Carousel carouselId="info-carousel"
                          className="white-text center"
                          options={{ fullWidth: true, indicators: false }}>
                    <div className="carousel-panel" id="panel-0">
                        <img src={"./assets/smartphone_placeholder.png"} alt=""/>
                        <h1>Hoe werkt het?</h1>
                        <p>Klik op het beginscherm op 'Start' om de opening te starten.</p>
                        <br/>
                        <p>Zo makkelijk is het!</p>
                    </div>
                    <div className="carousel-panel" id="panel-1">
                        <img src={"./assets/smartphone_placeholder.png"} alt=""/>
                        <h1>Wat nog meer?</h1>
                        <p>De app heeft ook nog het kopje account.
                            Hier kun je zien hoe goed je het goed en
                            wanneer je een volgende afspraak hebt gepland.</p>
                    </div>
                    <div className="carousel-panel" id="panel-2">
                        <img src={"./assets/smartphone_placeholder.png"} alt=""/>
                        <h1>Vragen?</h1>
                        <p>Heb je hulp nodig?</p>
                        <p>Klik dan op vragen.</p>
                    </div>
                </Carousel>
                <div className="carousel-controls">
                    <span>Overslaan</span>
                    <div className="indicators" style={{opacity: 0}}>
                        <div className='indicator'/>
                        <div className='indicator'/>
                        <div className='indicator'/>
                    </div>
                    <span>Volgende</span>
                </div>
            </div>
        );
    }

}