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
            <p style={{marginLeft: "200px", marginRight: "200px"}}>
                When you select the ZIP code you are interested in, you can track the
                spread of bedbugs in the following plot according to their filing date.
                Push the slider to see how the cases spread across the map as time progresses
                since the first case was filed. Surprisingly, it does not look like there is some kind of trend that
                we can follow in its spread. It looks like they just appear at random times.
            </p>
            <p style={{marginLeft: "200px", marginRight: "200px"}}>
                If you left the ZIP code unselected (NYC at large), you can also see the number
                of infested dwelling unit per ZIP code as a heat map.
            </p>
            <Iframe url={graph1}
                    width="1070px"
                    height="875px"
                    styles={{backgroundColor: "white"}}
            />

            <h2>Monthly Number of Infested Unit in ZIP code</h2>
            <p style={{marginLeft: "200px", marginRight: "200px"}}>
                The following bar chart tracks the number of bedbugs infestation cases filed in each month in the ZIP
                code you selected. If you left the ZIP code unselected, you can see the total number in NYC. The result
                below could somewhat answers the oddities found in the previous graph because it looks like most filings
                happen at the same time, which could be explained by the
                <a
                    href="https://www.nyc.gov/site/hpd/services-and-information/bedbugs.page"
                    style={{color: 'white'}}
                > annual requirement of reporting</a>. Since the reporting is only happens annually, the data is not accurate in
                portraying the spread.
            </p>
            <Iframe url={graph2}
                    width="980px"
                    height="900px"
                    styles={{backgroundColor: "white"}}
            />

            <h2>Monthly Number of Infested Unit in Each Borough</h2>
            <p style={{marginLeft: "200px", marginRight: "200px"}}>
                The following line chart tracks the number of bedbugs infestation cases filed in each month in each
                borough. All boroughs, with the exception of Queens in April 2021, follows the same trend. The result
                was expected because denser boroughs (Manhattan and Brooklyn) has more infested units than in sparser
                boroughs (Staten Island).
            </p>
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
