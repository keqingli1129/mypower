// Step 1 — the smallest generative page that works.
// A page is just a React component: a function that returns what to draw.

import React from "react";
import { Text } from "@fluentui/react-components";

const GeneratedComponent = () => {
    const today = new Date().toLocaleDateString();

    return (
        <div style={{ padding: 24 }}>
            <Text size={800} weight="bold" block>
                Game Night HQ
            </Text>
            <Text block>Today is {today}.</Text>
        </div>
    );
};

export default GeneratedComponent;
