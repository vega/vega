import React from "react";
import "../bootstrap/css/bootstrap.min.css";

import CohortTable from "./cohortTable";

export default function App() {
    return (
        <div className="App container">
            <h1 className="mt-5 text-center">Cohort Table</h1>
            <CohortTable />
        </div>
    );
}
