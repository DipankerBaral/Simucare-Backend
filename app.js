const express = require("express");
const AWS = require("aws-sdk");

const cors = require("cors"); // Import the cors package

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for all routes
app.use(cors());

// Initialize AWS SDK with your credentials and region
AWS.config.update({
  accessKeyId: "AKIAZVC5RQVFQUSULGIL",
  secretAccessKey: "yyE9SgNI/v/eao9iE6phw/55pULV0NzKIdoT/UIY",
  region: "ap-southeast-2", // e.g., 'us-east-1'
});

// Create a DynamoDB client
const dynamoDB = new AWS.DynamoDB();

// Middleware to parse JSON requests
app.use(express.json());

app.get("/api/getScenarioState", (req, res) => {
  const params = {
    TableName: "ScenarioState", // Your DynamoDB table name for scenario state
  };

  dynamoDB.scan(params, (err, data) => {
    if (err) {
      console.error("Error fetching scenario state from DynamoDB:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(data.Items);
    }
  });
});

app.post("/api/addScenarioStep", (req, res) => {
  const { Name, StateName, StepDescription, StepNumber, Timer, Values } =
    req.body;

  // Log the data received from the frontend
  console.log("Data received from frontend:", {
    Name,
    StateName,
    StepDescription,
    StepNumber,
    Timer,
    Values,
  });

  // Convert the Values object into an array of objects
  const valuesArray = Object.keys(Values).map((key) => ({
    M: {
      key: { S: key },
      value: { S: Values[key] },
    },
  }));

  // Create the ID by combining Name and StepNumber
  const ID = `${Name}-${StepNumber}`;

  // Accumulate the data in an object
  const dataToInsert = {
    ID: { S: ID }, // Include the ID field
    Name: { S: Name },
    StateName: { S: StateName },
    StepDescription: { S: StepDescription },
    StepNumber: { S: StepNumber },
    Timer: { S: Timer },
    Values: { L: valuesArray },
  };

  // Send data to DynamoDB
  const params = {
    TableName: "Scenario", // Replace with your DynamoDB table name
    Item: dataToInsert,
  };

  dynamoDB.putItem(params, (err, data) => {
    if (err) {
      console.error("Error adding data to DynamoDB", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    console.log("Data added to DynamoDB", data);
    res.json({ message: "Data added to DynamoDB" });
  });
});

app.get("/api/getStateValues", (req, res) => {
  const stateName = req.query.stateName;

  const params = {
    TableName: "ScenarioState", // Replace with your DynamoDB table name
    Key: {
      Name: { S: stateName },
    },
  };

  dynamoDB.getItem(params, (err, data) => {
    if (err) {
      console.error("Error fetching data from DynamoDB", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (!data.Item) {
      return res.status(404).json({ error: "State not found" });
    }

    const stateData = AWS.DynamoDB.Converter.unmarshall(data.Item);
    res.json(stateData);
  });
});

// ... (previous code)

app.get("/api/getScenario", (req, res) => {
  const params = {
    TableName: "Scenario", // Your DynamoDB table name for scenario data
  };

  dynamoDB.scan(params, (err, data) => {
    if (err) {
      console.error("Error fetching scenario data from DynamoDB:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(data.Items);
    }
  });
});

// ... (remaining code)

app.post("/api/addScenarioState", (req, res) => {
  const { Name, CO2value, ecgBPM, IBPvalue, RESPvalue, SpO2value, TEMPvalue } =
    req.body;

  // Check if any of the required fields are missing or empty

  console.log("Received request body:", req.body); // Log the request body

  const params = {
    TableName: "ScenarioState", // Your DynamoDB table name for scenario state
    Item: {
      Name: { S: Name },
      CO2value: { S: CO2value },
      ecgBPM: { S: ecgBPM },
      IBPvalue: { S: IBPvalue },
      RESPvalue: { S: RESPvalue },
      SpO2value: { S: SpO2value },
      TEMPvalue: { S: TEMPvalue },
    },
  };

  dynamoDB.putItem(params, (err, data) => {
    if (err) {
      console.error("Error creating data in DynamoDB:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json({ message: "Data created successfully" });
    }
  });
});

// ... (previous code)

// Define an API endpoint to add data to the "monitor" table
app.post("/api/addMonitorData", (req, res) => {
  const { Name, ScenarioRun, Student } = req.body;

  // Convert received data to strings
  const stringName = String(Name);
  const stringScenarioRun = String(ScenarioRun);
  const stringStudent = String(Student);

  console.log("Received data from frontend:");
  console.log("Name:", stringName);
  console.log("ScenarioRun:", stringScenarioRun);
  console.log("Student:", stringStudent);

  // Create an object with the data you want to add
  const item = {
    TableName: "Monitor", // Your DynamoDB table name for monitor data
    Item: {
      Name: { S: stringName },
      ScenarioRun: { S: stringScenarioRun },
      Student: { S: stringStudent },
    },
  };

  // Put the item into the DynamoDB table
  dynamoDB.putItem(item, (err, data) => {
    if (err) {
      console.error("Error adding monitor data to DynamoDB:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json({ message: "Monitor data added successfully" });
    }
  });
});

app.get("/api/getMonitorData", (req, res) => {
  // Create parameters for the scan operation
  const params = {
    TableName: "Monitor", // Your DynamoDB table name for monitor data
  };

  // Scan the DynamoDB table to retrieve all items
  dynamoDB.scan(params, (err, data) => {
    if (err) {
      console.error("Error retrieving monitor data from DynamoDB:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      // Extract and send the retrieved data to the client
      const monitorData = data.Items.map((item) => ({
        Name: item.Name.S,
        ScenarioRun: item.ScenarioRun.S,
        Student: item.Student.S,
      }));

      res.json(monitorData);
    }
  });
});

app.post("/api/addDataToTable", (req, res) => {
  const { Id, DescriptionStep, HealthValues, isSimulationRunning } = req.body;

  // Define the DynamoDB params
  const params = {
    TableName: "HealthMonitor", // Replace with your DynamoDB table name
    Item: {
      Id: { S: Id },
      DescriptionStep: { L: DescriptionStep },
      HealthValues: { L: HealthValues },
      isSimulationRunning: { BOOL: isSimulationRunning },
    },
  };

  // Put the item into DynamoDB
  dynamoDB.putItem(params, (err, data) => {
    if (err) {
      console.error("Error putting item into DynamoDB:", err);
      res.status(500).json({ error: "Error putting item into DynamoDB" });
    } else {
      console.log("Item added to DynamoDB:", data);
      res.status(200).json({ message: "Item added to DynamoDB" });
    }
  });
});
// ... (remaining code)
app.get("/api/getDataFromTable/:id", (req, res) => {
  const { id } = req.params;

  // Define the DynamoDB params for the getItem operation
  const params = {
    TableName: "HealthMonitor", // Replace with your DynamoDB table name
    Key: {
      Id: { S: id },
    },
  };

  // Get the item from DynamoDB
  dynamoDB.getItem(params, (err, data) => {
    if (err) {
      console.error("Error getting item from DynamoDB:", err);
      res.status(500).json({ error: "Error getting item from DynamoDB" });
    } else if (!data.Item) {
      console.log("Item not found in DynamoDB");
      res.status(404).json({ error: "Item not found in DynamoDB" });
    } else {
      const item = {
        Id: data.Item.Id.S,
        DescriptionStep: data.Item.DescriptionStep.L,
        HealthValues: data.Item.HealthValues.L,
        isSimulationRunning: data.Item.isSimulationRunning.BOOL,
      };
      console.log("Item retrieved from DynamoDB:", item);
      res.status(200).json(item);
    }
  });
});

app.get("/api/getRegisterData", (req, res) => {
  const params = {
    TableName: "Register",
  };

  dynamoDB.scan(params, (err, data) => {
    if (err) {
      console.error("Error retrieving data from DynamoDB:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      const registerData = data.Items;
      res.json(registerData);
    }
  });
});

// POST API to add data to the DynamoDB table
app.post("/api/register", (req, res) => {
  const { Email, Username, Role, Password } = req.body;

  const params = {
    TableName: "Register",
    Item: {
      Email,
      Username,
      Role,
      Password,
    },
  };

  dynamoDB.putItem(params, (err, data) => {
    if (err) {
      console.error("Error inserting data into DynamoDB:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.status(201).json({ message: "Registration successful" });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
