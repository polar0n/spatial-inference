import asyncio
import aiofiles
from sanic import Sanic, json
from sanic_ext import render
import uuid
from functools import partial
from jsonschema import ValidationError as JSONValidationError
from jsonschema import validate as json_validate


schema = {
    'type': 'object',
    'properties': {
        'form_id': {
            'type': 'string',
            'format': 'uuid'
        },
        'data': {
            'type': 'object',
            'properties': {
                'age': {
                    'type': 'number',
                    'minimum': 0
                },
                'sex': {
                    'type': 'number',
                    'minimum': 0,
                    'maximum': 1
                },
                'inference': {
                    'type': 'number',
                    'minimum': 0,
                    'maximum': 1
                },
                'inferencet': {
                    'type': 'number',
                    'minimum': 0
                },
                'mistakes': {
                    'type': 'number',
                    'minimum': 0
                },
                'group': {
                    'type': 'number',
                    'minimum': 0,
                    'maximum': 2
                }
            },
            'required': ['age', 'sex', 'inference', 'inferencet', 'mistakes', 'group']
        }
    },
    'required': ['form_id', 'data']
}


app = Sanic('Experiment_Backend')
app.ctx.form_ids = list()
app.ctx.filename = 'data_collection.csv'
app.ctx.EMPTY_JSON = json(dict())


@app.get("/")
async def index(_):
    '''Handle index requests and serve index.html with generated form_id.'''
    return await render(
        'index.html', context={'form_id': generate_id()}
    )


@app.post('/api')
async def api(request):
    '''Process data collection from users.'''
    try:
        json_validate(instance=request.json, schema=schema)
    except JSONValidationError as e:
        print(e)
        return app.ctx.EMPTY_JSON

    form_id = request.json.get('form_id')

    # Check if the form_id is registered
    if form_id not in app.ctx.form_ids:
        return app.ctx.EMPTY_JSON

    # Cancel the auto-purge task for the current form_id
    await app.cancel_task(name=form_id)
    # Remove the form_id manually from the registered ids
    app.ctx.form_ids.remove(form_id)
    # Transform data into CSV format
    data = transform_data(request.json['data'])
    print(f'Received data: {data}')
    # Delegate task as a partial function to the loop that will write the collected data
    app.add_task(partial(push_to_file, data))

    return app.ctx.EMPTY_JSON


def transform_data(data: dict) -> str:
    '''Transform JSON data into a CSV format.'''
    return ','.join([str(data[key]) for key in ('age', 'sex', 'inference', 'inferencet', 'mistakes', 'group')])


async def push_to_file(data: str):
    '''Asynchronously write the data to the file.'''
    async with aiofiles.open(app.ctx.filename, mode='a') as file:
        await file.write(data + '\n')


def generate_id():
    '''Generate an UUID4.'''


    async def destroy_expired_form_id(form_id):
        '''Unregister the form_id if it expired after 30 minutes.'''
        await asyncio.sleep(7200)
        print(f'Deregister: {form_id}')
        app.ctx.form_ids.remove(form_id)


    form_id = str(uuid.uuid4())
    print(f'Register: {form_id}')
    app.ctx.form_ids.append(form_id)
    # Delegate a partial task to unregister the unclaimed id
    app.add_task(partial(destroy_expired_form_id, form_id), name=form_id)
    return form_id
