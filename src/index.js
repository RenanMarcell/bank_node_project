const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const customers = [];

const verifyCPF = (request, response, next) => {
    const { cpf } = request.params;

    const customer = customers.find(customer => customer.cpf === cpf);

    if(!customer) return response.status(404).json({
        error: "Customer not found"
    });

    request.customer = customer;
    next()
}

const getBalance = statements => {
    return statements.reduce((acc, operation) => {
        if(operation.type === 'credit') {
            acc += operation.amount;
        } else {
            acc -= operation.amount;
        };
        return acc;
    }, 0);
}

app.post('/account', (request, response) => {
    const { name, cpf } = request.body;

    const customerAlreadyRegistered = customers.some(
        customer => customer.cpf === cpf
    );

    if(customerAlreadyRegistered) return response.status(400).json({
        error: "Customer already registered"
    });

    const customer = {
        name,
        cpf,
        uuid: uuidv4(),
        statements: []
    }

    customers.push(customer)
    return response.json(customer);
})

app.post('/deposit/:cpf', verifyCPF, (request, response) => {
    const { description, amount } = request.body;
    const { customer } = request;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: 'credit'
    };

    customer.statements.push(statementOperation);

    return response.status(201).send();
})

app.post('/withdraw/:cpf', verifyCPF, (request, response) => {
    const { description, amount } = request.body;
    const { customer } = request;

    const balance = getBalance(customer.statements);

    if(amount > balance) 
        return response.status(400).json({
            error: "Customer does not have this amount!"
        });

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: 'withdraw'
    };

    customer.statements.push(statementOperation);

    return response.status(201).send();
})

app.get('/statements/:cpf', verifyCPF, (request, response) => {
    const { customer } = request;
    return response.json({
        statements: customer.statements
    });
})

app.get('/statements/:cpf/date', verifyCPF, (request, response) => {
    const { customer } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + ' 00:00');

    const statements = customer.statements.filter(operation => 
        operation.created_at.toDateString() === new Date(dateFormat).toDateString()
    )

    return response.json({
        statements
    });
})

app.put('/account/:cpf', verifyCPF, (request, response) => {
    const { name } = request.body;
    const { customer } = request;

    customer.name = name;

    return response.status(201).send();
})

app.get('/account/:cpf', verifyCPF, (request, response) => {
    const { customer } = request;

    return response.json(customer);
})

app.get('/account/:cpf/balance', verifyCPF, (request, response) => {
    const { customer } = request;

    const balance = getBalance(customer.statements);

    return response.json({ balance });
})


app.delete('/account/:cpf', verifyCPF, (request, response) => {
    const { customer } = request;

    customers.splice(customer, 1);

    return response.send(204);
})

app.listen(3333, () => console.log('Server is running!'));
