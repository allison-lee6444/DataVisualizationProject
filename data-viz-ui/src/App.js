import './App.css';
import {useEffect, useState} from "react";
import Iframe from "react-iframe";
import Select from 'react-select';

import "react-datepicker/dist/react-datepicker.css";

function App() {
    const [graph1, setGraph1] = useState(null);
    const [graph2, setGraph2] = useState(null);
    const [graph3, setGraph3] = useState(null);
    const [eligibleZipChoices, setEligibleZipChoices] = useState(null);
    const [graph1Zip, setGraph1Zip] = useState(0);

    useEffect(() => {
        fetch('http://localhost:8000/graph1/' + graph1Zip)
            .then((response) => response.json())
            .then(data => {
                const page = new Blob([data.plot], {type: "text/html"});
                setGraph1(window.URL.createObjectURL(page));
            })
            .catch((err) => console.error(err));
    }, [graph1Zip]);

    useEffect(() => {
        fetch('http://localhost:8000/graph2/' + graph1Zip)
            .then((response) => response.json())
            .then(data => {
                const page = new Blob([data.plot], {type: "text/html"});
                setGraph2(window.URL.createObjectURL(page));
            })
            .catch((err) => console.error(err));
    }, [graph1Zip]);

    useEffect(() => {
        fetch('http://localhost:8000/graph3/')
            .then((response) => response.json())
            .then(data => {
                const page = new Blob([data.plot], {type: "text/html"});
                setGraph3(window.URL.createObjectURL(page));
            })
            .catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        fetch("http://localhost:8000/graph1/eligible_zip")
            .then((response) => response.json())
            .then(data => setEligibleZipChoices(
                [{label: "NYC at large", value: 0}, ...data.zips.map(elem => ({label: elem, value: elem}))]
            ))
            .catch((err) => console.error(err));
    }, [])

    const onChangeGraph1Zip = (zip) => {
        setGraph1Zip(zip.value);
    }


    return (
        <div className="App">

            <p>Select ZIP Code:</p>
            <Select
                options={eligibleZipChoices}
                defaultValue={{label: "NYC at large", value: 0}}
                styles={{
                    option: provided => ({
                        ...provided,
                        color: 'black'
                    }),
                    control: provided => ({
                        ...provided,
                        color: 'black'
                    }),
                    singleValue: provided => ({
                        ...provided,
                        color: 'black'
                    }),
                }}
                onChange={onChangeGraph1Zip}
            />

            <h2>Infested Unit in ZIP code</h2>

            <Iframe url={graph1}
                    width="1070px"
                    height="875px"
                    styles={{backgroundColor: "white"}}
            />

            <h2>Monthly Number of Infested Unit in ZIP code</h2>
            <Iframe url={graph2}
                    width="930px"
                    height="900px"
                    styles={{backgroundColor: "white"}}
            />

            <h2>Monthly Number of Infested Unit in Each Borough</h2>
            <Iframe url={graph3}
                    width="1080px"
                    height="900px"
                    styles={{backgroundColor: "white"}}
            />

            <div className="bottom"></div>

        </div>
    );
}

export default App;
