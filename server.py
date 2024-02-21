import asyncio
import aiofiles
from sanic import Sanic, json
from sanic_ext import render
from sanic.log import logger
import uuid
from functools import partial
from jsonschema import ValidationError as JSONValidationError
from jsonschema import validate as json_validate


COLUMNS = (
    'age',
    'sex',
    'cb',
    'choice_time1',
    'choice_time2',
    'inference1',
    'inferencet1',
    'inference2',
    'inferencet2',
    'mistakes1',
    'mistakes2',
    'group'
)

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
                'cb': {
                    'type': 'number',
                    'minimum': 0,
                    'maximum': 1
                },
                'choice_time1': {
                    'type': 'number',
                    'minimum' : -1
                },
                'inference1': {
                    'type': 'number',
                    'minimum': -1,
                    'maximum': 1
                },
                'inferencet1': {
                    'type': 'number',
                    'minimum': -1
                },
                'choice_time2': {
                    'type': 'number',
                    'minimum': -1
                },
                'inference2': {
                    'type': 'number',
                    'minimum': -1,
                    'maximum': 1
                },
                'inferencet2': {
                    'type': 'number',
                    'minimum': -1
                },
                'mistakes1': {
                    'type': 'number',
                    'minimum': 0
                },
                'mistakes2': {
                    'type': 'number',
                    'minimum': 0
                },
                'group': {
                    'type': 'number',
                    'minimum': 0,
                    'maximum': 2
                }
            },
            'required': list(COLUMNS)
        },
        'timesg1': {
            'type': 'array'
        },
        'timesg2': {
            'type': 'array'
        }
    },
    'required': ['form_id', 'data', 'timesg1', 'timesg2']
}


app = Sanic('Experiment_Backend15')
app.ctx.form_ids = list()
app.ctx.csv = 'data_collection.csv'
app.ctx.txt = 'times_data.txt'
app.ctx.group_cycle = False
app.ctx.EMPTY_JSON = json(dict())


@app.get("/")
async def index(request):
    '''Handle index requests and serve index.html with generated form_id.'''
    app.ctx.group_cycle = not app.ctx.group_cycle
    return await render(
        'index.html', context={
            'form_id': generate_id(),
            'group': int(app.ctx.group_cycle)
        }
    )


@app.post('/api')
async def api(request):
    '''Process data collection from users.'''
    try:
        json_validate(instance=request.json, schema=schema)
    except JSONValidationError as e:
        logger.info(f'The following JSON could not be validated: {request.json}')
        logger.exception(e)
        return app.ctx.EMPTY_JSON

    form_id = request.json.get('form_id')

    # Check if the form_id is registered
    if form_id not in app.ctx.form_ids:
        logger.exception(f'Non-existent ID received: {form_id}')
        return app.ctx.EMPTY_JSON

    # Cancel the auto-purge task for the current form_id
    await app.cancel_task(name=form_id)
    # Remove the form_id manually from the registered ids
    app.ctx.form_ids.remove(form_id)
    # Transform data into CSV format
    data = transform_data(request.json['data'])
    logger.info(f'Received data: {data}')
    # Delegate task as a partial function to the loop that will write the collected data
    app.add_task(partial(push_to_file, app.ctx.csv, data))
    app.add_task(partial(
        push_to_file,
        app.ctx.txt,
        str([request.json['timesg1'], request.json['timesg2']])
    ))

    return app.ctx.EMPTY_JSON


def transform_data(data: dict) -> str:
    '''Transform JSON data into a CSV format.'''
    return ','.join([str(data[key]) for key in COLUMNS])


async def push_to_file(filename:str, data: str):
    '''Asynchronously write the data to the file.'''
    async with aiofiles.open(filename, mode='a') as file:
        await file.write(data + '\n')


def generate_id():
    '''Generate an UUID4.'''


    async def destroy_expired_form_id(form_id):
        '''Unregister the form_id if it expired after 30 minutes.'''
        await asyncio.sleep(7200)
        logger.info(f'Deregister: {form_id}')
        app.ctx.form_ids.remove(form_id)


    form_id = str(uuid.uuid4())
    logger.info(f'Register: {form_id}')
    app.ctx.form_ids.append(form_id)
    # Delegate a partial task to unregister the unclaimed id
    app.add_task(partial(destroy_expired_form_id, form_id), name=form_id)
    return form_id
