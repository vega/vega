import React from "react";
const data = require("../components/data");

class CohortTable extends React.Component {
    render() {
        function renderNumber () {
            let arr = [];
            for (let i = 1; i <= data.median.length; i++) {
                arr.push(
                    <tr className="d-flex justify-content-center">{i}</tr>
                );
            }
            return arr;
        }

        function markContrastValues(item, firstMax, firstMin) {
            if (item === firstMax) {
                return <tr className="d-flex justify-content-center bg-success">{item}</tr>;
            } else if (item === firstMin) {
                return <tr className="d-flex justify-content-center bg-danger">{item}</tr>;
            }

            return <tr className="d-flex justify-content-center">{item}</tr>;
        }

        const renderFirstMedian = data.median.map(itemValue => markContrastValues(
            `${itemValue}`, `${Math.max(...data.median)}`, `${Math.min(...data.median)}`)
        );
        const renderMode = data.mode.map(itemValue => markContrastValues(
            `${itemValue}`, `${Math.max(...data.mode)}`, `${Math.min(...data.mode)}`)
        );
        const renderSummary = data.summary.map(itemValue => markContrastValues(
            `${itemValue}`, `${Math.max(...data.summary)}`, `${Math.min(...data.summary)}`)
        );

        return (
            <div className="mt-3 d-flex justify-content-center">
                <table className="table w-50 table-bordered">
                    <thead>
                        <tr>
                            <th scope="col"><span className="d-flex justify-content-center">№</span></th>
                            <th scope="col"><span className="d-flex justify-content-center">Median</span></th>
                            <th scope="col"><span className="d-flex justify-content-center">Mode</span></th>
                            <th scope="col"><span className="d-flex justify-content-center">Data Summary</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        <th>
                            {renderNumber()}
                        </th>
                        <td>
                            {renderFirstMedian}
                        </td>
                        <td>
                            {renderMode}
                        </td>
                        <td>
                            {renderSummary}
                        </td>
                    </tbody>
                </table>
            </div>
        );
    }
}

export default CohortTable;
